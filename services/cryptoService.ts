import { AnalysisResult, HistoricalDataPoint } from '../types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CRYPTOCOMPARE_API = 'https://min-api.cryptocompare.com/data/v2';
const COINBASE_API = 'https://api.exchange.coinbase.com';

// Helper to calculate simple moving average
const calculateSMA = (data: number[], window: number): number | null => {
  if (data.length < window) return null;
  const slice = data.slice(data.length - window);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / window;
};

// Helper to calculate standard deviation
const calculateStdDev = (data: number[], mean: number): number => {
  const squareDiffs = data.map((value) => {
    const diff = value - mean;
    return diff * diff;
  });
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
};

// ------------------------------------------------------------------
// DATA SOURCE: MOCK (Last Resort)
// ------------------------------------------------------------------
const generateMockData = (): AnalysisResult => {
  console.warn("Using Mock Data Generator");
  const history: HistoricalDataPoint[] = [];
  const today = new Date();
  
  let ethPrice = 1500;
  let btcPrice = 20000;
  
  for (let i = 730; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const btcVol = (Math.random() - 0.45) * 0.04;
    const ethVol = (Math.random() - 0.45) * 0.05;
    
    btcPrice = Math.max(10000, btcPrice * (1 + btcVol));
    ethPrice = Math.max(800, ethPrice * (1 + ethVol));

    const ratio = ethPrice / btcPrice;
    
    history.push({
      date: dateStr,
      timestamp: date.getTime(),
      ethPrice,
      btcPrice,
      ratio,
      ma50: null,
      ma200: null,
      zScore: null
    });
  }

  const rawRatios = history.map(h => h.ratio);
  history.forEach((h, i) => {
    const subset = rawRatios.slice(0, i + 1);
    h.ma50 = calculateSMA(subset, 50);
    h.ma200 = calculateSMA(subset, 200);
    
    if (subset.length > 50) {
        const mean = subset.reduce((a, b) => a + b, 0) / subset.length;
        const std = calculateStdDev(subset, mean);
        h.zScore = std !== 0 ? (h.ratio - mean) / std : 0;
    }
  });

  const latest = history[history.length - 1];

  let ethScore = 0;
  let btcScore = 0;
  if (latest.ma200 && latest.ratio > latest.ma200) ethScore += 2; else btcScore += 2;
  if (latest.zScore && latest.zScore < -1) ethScore += 2; else if (latest.zScore && latest.zScore > 1) btcScore += 2;
  if (latest.ma50 && latest.ma200 && latest.ma50 > latest.ma200) ethScore += 1; else btcScore += 1;
  ethScore += 1;

  let signal: 'HOLD ETH' | 'HOLD BTC' | 'NEUTRAL' = 'NEUTRAL';
  if (ethScore >= btcScore + 3) signal = 'HOLD ETH';
  else if (btcScore >= ethScore + 3) signal = 'HOLD BTC';

  return {
    currentDate: latest.date,
    currentRatio: latest.ratio,
    currentEthPrice: latest.ethPrice,
    currentBtcPrice: latest.btcPrice,
    ma50: latest.ma50 || 0,
    ma200: latest.ma200 || 0,
    zScore: latest.zScore || 0,
    btcDominance: 54.2, 
    ethScore,
    btcScore,
    signal,
    history,
    loading: false,
    error: null,
    isDemo: true
  };
};

// ------------------------------------------------------------------
// DATA SOURCE: CRYPTOCOMPARE (Primary for Prices)
// ------------------------------------------------------------------
const fetchFromCryptoCompare = async (): Promise<{ btcData: any[], ethData: any[] }> => {
  // limit=730 for 2 years of daily data
  const [btcRes, ethRes] = await Promise.all([
    fetch(`${CRYPTOCOMPARE_API}/histoday?fsym=BTC&tsym=USD&limit=730`),
    fetch(`${CRYPTOCOMPARE_API}/histoday?fsym=ETH&tsym=USD&limit=730`)
  ]);

  if (!btcRes.ok || !ethRes.ok) {
    throw new Error(`CryptoCompare API Error: ${btcRes.status} / ${ethRes.status}`);
  }

  const btcJson = await btcRes.json();
  const ethJson = await ethRes.json();

  if (btcJson.Response === 'Error' || ethJson.Response === 'Error') {
    throw new Error(`CryptoCompare API Error Message: ${btcJson.Message || ethJson.Message}`);
  }

  // CryptoCompare returns Data.Data array with { time: unix_seconds, close: number } in chronological order
  const btcData = btcJson.Data.Data.map((d: any) => [d.time * 1000, d.close]);
  const ethData = ethJson.Data.Data.map((d: any) => [d.time * 1000, d.close]);

  return { btcData, ethData };
};

// ------------------------------------------------------------------
// DATA SOURCE: COINBASE (Secondary Fallback)
// ------------------------------------------------------------------
const fetchFromCoinbase = async (): Promise<{ btcData: any[], ethData: any[] }> => {
  // Coinbase candles max 300 per request. We will use the most recent 300 days (~10 months) if primary fails.
  // This ensures real data is displayed instead of mock data, even if the Z-Score window is shorter.
  const [btcRes, ethRes] = await Promise.all([
    fetch(`${COINBASE_API}/products/BTC-USD/candles?granularity=86400`),
    fetch(`${COINBASE_API}/products/ETH-USD/candles?granularity=86400`)
  ]);

  if (!btcRes.ok || !ethRes.ok) {
    throw new Error(`Coinbase API Error: ${btcRes.status} / ${ethRes.status}`);
  }

  const btcJson = await btcRes.json();
  const ethJson = await ethRes.json();

  // Coinbase returns [time, low, high, open, close, volume] in NEWEST FIRST order.
  // We need to reverse it to be chronological (Oldest First).
  const btcData = btcJson.map((d: number[]) => [d[0] * 1000, d[4]]).reverse();
  const ethData = ethJson.map((d: number[]) => [d[0] * 1000, d[4]]).reverse();

  return { btcData, ethData };
};

const fetchDominance = async (): Promise<number> => {
  try {
    // Try CoinGecko for Global Data (Dominance)
    const globalRes = await fetch(`${COINGECKO_API}/global`);
    if (!globalRes.ok) throw new Error('Global fetch failed');
    const globalJson = await globalRes.json();
    return globalJson.data?.market_cap_percentage?.btc || 58;
  } catch (e) {
    // If Global fails (rate limit), use a safe fallback so we don't break the whole app
    console.warn("Could not fetch real-time dominance, using fallback estimate.");
    return 58.5; 
  }
};

// ------------------------------------------------------------------
// DATA SOURCE: COINGECKO (Tertiary Fallback)
// ------------------------------------------------------------------
const fetchFromCoinGecko = async (): Promise<{ btcData: any[], ethData: any[] }> => {
  const [btcRes, ethRes] = await Promise.all([
    fetch(`${COINGECKO_API}/coins/bitcoin/market_chart?vs_currency=usd&days=730`),
    fetch(`${COINGECKO_API}/coins/ethereum/market_chart?vs_currency=usd&days=730`)
  ]);

  if (!btcRes.ok || !ethRes.ok) {
    throw new Error('CoinGecko API Error');
  }

  const btcJson = await btcRes.json();
  const ethJson = await ethRes.json();

  return {
    btcData: btcJson.prices,
    ethData: ethJson.prices
  };
};

// ------------------------------------------------------------------
// MAIN ANALYZER
// ------------------------------------------------------------------
export const fetchAndAnalyzeData = async (): Promise<AnalysisResult> => {
  let btcData: any[] = [];
  let ethData: any[] = [];
  let btcDominance = 58.5; // Default safe value

  try {
    // 1. Try Primary Source (CryptoCompare)
    const priceData = await fetchFromCryptoCompare();
    btcData = priceData.btcData;
    ethData = priceData.ethData;
  } catch (err) {
    console.warn("Primary API (CryptoCompare) failed, switching to secondary...", err);
    try {
      // 2. Try Secondary Source (Coinbase)
      const cbData = await fetchFromCoinbase();
      btcData = cbData.btcData;
      ethData = cbData.ethData;
    } catch (cbErr) {
       console.warn("Secondary API (Coinbase) failed, switching to tertiary...", cbErr);
       try {
        // 3. Try Tertiary Source (CoinGecko)
        const cgData = await fetchFromCoinGecko();
        btcData = cgData.btcData;
        ethData = cgData.ethData;
       } catch (fallbackErr) {
        console.warn("All APIs failed. Using Mock Data.", fallbackErr);
        return generateMockData();
       }
    }
  }

  // Try fetching dominance (non-blocking)
  const dom = await fetchDominance();
  if (dom) btcDominance = dom;

  if (!btcData.length || !ethData.length) return generateMockData();

  try {
    // Process and Align Data
    const btcMap = new Map<string, number>();
    btcData.forEach(([ts, price]) => {
      const date = new Date(ts).toISOString().split('T')[0];
      btcMap.set(date, price);
    });

    const processedHistory: HistoricalDataPoint[] = [];
    const rawRatios: number[] = [];

    ethData.forEach(([ts, ethPrice]) => {
      const date = new Date(ts).toISOString().split('T')[0];
      const btcPrice = btcMap.get(date);

      if (btcPrice) {
        const ratio = ethPrice / btcPrice;
        rawRatios.push(ratio);

        const ma50 = calculateSMA(rawRatios, 50);
        const ma200 = calculateSMA(rawRatios, 200);

        let zScore = null;
        if (rawRatios.length > 50) { 
            const mean = rawRatios.reduce((a, b) => a + b, 0) / rawRatios.length;
            const std = calculateStdDev(rawRatios, mean);
            zScore = std !== 0 ? (ratio - mean) / std : 0;
        }

        processedHistory.push({
          date,
          timestamp: ts,
          ethPrice,
          btcPrice,
          ratio,
          ma50,
          ma200,
          zScore
        });
      }
    });

    const latest = processedHistory[processedHistory.length - 1];
    if (!latest) throw new Error('Insufficient data calculated');

    // Scoring Logic
    let ethScore = 0;
    let btcScore = 0;

    // Trend
    if (latest.ma200 && latest.ratio > latest.ma200) ethScore += 2; else btcScore += 2;
    // Value
    if (latest.zScore && latest.zScore < -1) ethScore += 2; else if (latest.zScore && latest.zScore > 1) btcScore += 2;
    // Momentum
    if (latest.ma50 && latest.ma200) {
      if (latest.ma50 > latest.ma200) ethScore += 1; else btcScore += 1;
    }
    // Dominance
    if (btcDominance > 50) btcScore += 1; else ethScore += 1;

    // Seasonality
    const currentMonth = new Date().getMonth() + 1;
    if ([4, 5, 6].includes(currentMonth)) ethScore += 1;
    else if ([1, 2, 3, 9].includes(currentMonth)) btcScore += 1;

    let signal: 'HOLD ETH' | 'HOLD BTC' | 'NEUTRAL' = 'NEUTRAL';
    if (ethScore >= btcScore + 3) signal = 'HOLD ETH';
    else if (btcScore >= ethScore + 3) signal = 'HOLD BTC';
    else signal = 'NEUTRAL';

    return {
      currentDate: latest.date,
      currentRatio: latest.ratio,
      currentEthPrice: latest.ethPrice,
      currentBtcPrice: latest.btcPrice,
      ma50: latest.ma50 || 0,
      ma200: latest.ma200 || 0,
      zScore: latest.zScore || 0,
      btcDominance,
      ethScore,
      btcScore,
      signal,
      history: processedHistory,
      loading: false,
      error: null,
      isDemo: false // Real data was used
    };

  } catch (error: any) {
    console.error("Processing Error:", error);
    return generateMockData();
  }
};