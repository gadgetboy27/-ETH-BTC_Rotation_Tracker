import React, { useEffect, useState } from 'react';
import { fetchAndAnalyzeData } from './services/cryptoService';
import { AnalysisResult } from './types';
import SignalCard from './components/SignalCard';
import MetricsGrid from './components/MetricsGrid';
import RatioChart from './components/RatioChart';
import StrategyPanel from './components/StrategyPanel';
import { RefreshCw, LayoutDashboard, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchAndAnalyzeData();
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-zinc-100 font-sans selection:bg-primary/20">
      {/* Demo Warning - Only shows if we are FORCED to use mock data */}
      {data?.isDemo && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 py-2 px-4 text-center animate-in fade-in slide-in-from-top-2">
          <p className="text-yellow-500 text-xs font-medium flex items-center justify-center gap-2">
            <AlertTriangle size={14} />
            Live data unavailable (API Limits). Showing simulated scenarios.
          </p>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-surfaceHighlight bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-lg">
                <LayoutDashboard size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Ratio<span className="text-zinc-400 font-light">Pulse</span>
            </h1>
          </div>
          <button 
            onClick={loadData} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white bg-surfaceHighlight hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
             <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
             <p className="text-zinc-500 animate-pulse">Crunching historical data...</p>
          </div>
        ) : data && data.error ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md mx-auto">
            <div className="bg-red-500/10 text-red-500 p-4 rounded-full mb-4">
               <span className="text-3xl">!</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Data Feed Error</h3>
            <p className="text-zinc-400 mb-6">{data.error}</p>
            <button onClick={loadData} className="px-6 py-2 bg-primary hover:bg-blue-600 rounded-lg font-medium transition-colors">
              Try Again
            </button>
          </div>
        ) : data ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Last Updated */}
            <div className="flex justify-end mb-4">
               <span className="text-xs text-zinc-500 font-mono">
                 Data Analysis: {data.isDemo ? 'Simulated' : new Date().toLocaleDateString()}
               </span>
            </div>

            {/* Signal Hero */}
            <SignalCard 
              signal={data.signal} 
              ethScore={data.ethScore} 
              btcScore={data.btcScore} 
            />

            {/* Metrics Grid */}
            <MetricsGrid data={data} />

            {/* Charts */}
            <RatioChart data={data.history} />

            {/* Strategy Logic */}
            <StrategyPanel data={data} />

            {/* Footer / Disclaimer */}
            <div className="mt-12 pt-8 border-t border-zinc-800 text-center text-xs text-zinc-600 pb-8">
              <p>Disclaimer: This application provides quantitative analysis based on historical data. It is not financial advice.</p>
              <p className="mt-2">Primary Source: CryptoCompare. Fallbacks: Coinbase & CoinGecko. Indicators: SMA (Simple Moving Average), Z-Score (2-year window).</p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default App;