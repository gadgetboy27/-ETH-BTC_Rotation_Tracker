export interface HistoricalDataPoint {
  date: string;
  timestamp: number;
  ethPrice: number;
  btcPrice: number;
  ratio: number;
  ma50: number | null;
  ma200: number | null;
  zScore: number | null;
}

export interface MarketData {
  prices: [number, number][]; // [timestamp, price]
}

export interface AnalysisResult {
  currentDate: string;
  currentRatio: number;
  currentEthPrice: number;
  currentBtcPrice: number;
  ma50: number;
  ma200: number;
  zScore: number;
  btcDominance: number;
  ethScore: number;
  btcScore: number;
  signal: 'HOLD ETH' | 'HOLD BTC' | 'NEUTRAL';
  history: HistoricalDataPoint[];
  loading: boolean;
  error: string | null;
  isDemo?: boolean;
}

export interface ScoreBreakdown {
  label: string;
  value: string;
  pointsFor: 'ETH' | 'BTC' | 'NEUTRAL';
  points: number;
}