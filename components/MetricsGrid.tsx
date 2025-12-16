import React from 'react';
import { AnalysisResult } from '../types';
import { Activity, BarChart3, Percent, Scale, HelpCircle } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'neutral' | 'bullish' | 'bearish';
  tooltip?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, icon, trend, tooltip }) => {
  let trendColor = 'text-zinc-400';
  if (trend === 'bullish') trendColor = 'text-emerald-400';
  if (trend === 'bearish') trendColor = 'text-rose-400';

  return (
    <div className="group relative flex flex-col p-5 rounded-xl border border-surfaceHighlight bg-surface/50 hover:bg-surfaceHighlight/50 transition-colors cursor-default">
      {/* Tooltip Popup */}
      {tooltip && (
        <div className="absolute z-[60] bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-4 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl shadow-2xl opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
          <p className="font-semibold text-white mb-1">{label}</p>
          <p className="leading-relaxed text-zinc-400">{tooltip}</p>
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-zinc-800"></div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
            {tooltip && <HelpCircle size={13} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
        </div>
        <div className="text-zinc-600 bg-surfaceHighlight p-1.5 rounded-md">{icon}</div>
      </div>
      <div className="mt-auto">
        <div className={`text-2xl font-bold ${trendColor}`}>{value}</div>
        {subValue && <div className="text-xs text-zinc-500 mt-1">{subValue}</div>}
      </div>
    </div>
  );
};

const MetricsGrid: React.FC<{ data: AnalysisResult }> = ({ data }) => {
  // Determine Z-Score visual sentiment
  let zScoreTrend: 'neutral' | 'bullish' | 'bearish' = 'neutral';
  if (data.zScore < -1) zScoreTrend = 'bullish'; // Cheap ETH
  else if (data.zScore > 1) zScoreTrend = 'bearish'; // Expensive ETH

  // Determine Dominance sentiment
  let domTrend: 'neutral' | 'bullish' | 'bearish' = 'neutral';
  if (data.btcDominance > 55) domTrend = 'bearish'; // Strong BTC
  else if (data.btcDominance < 45) domTrend = 'bullish'; // Weak BTC

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <MetricCard 
        label="ETH/BTC Ratio"
        value={data.currentRatio.toFixed(5)}
        subValue={`1 ETH = ${data.currentRatio.toFixed(5)} BTC`}
        icon={<Scale size={18} />}
        trend={data.currentRatio > data.ma200 ? 'bullish' : 'bearish'}
        tooltip="The price of 1 ETH in BTC terms. A rising ratio indicates Ethereum outperformance. We compare this against long-term moving averages to determine trend direction."
      />
      
      <MetricCard 
        label="Z-Score (2YR)"
        value={data.zScore.toFixed(2)}
        subValue={data.zScore < -1 ? "Undervalued (ETH)" : data.zScore > 1 ? "Overvalued (ETH)" : "Fair Value"}
        icon={<Activity size={18} />}
        trend={zScoreTrend}
        tooltip="Standard deviations from the 2-year mean. Values < -1.0 suggest ETH is statistically cheap (Accumulation Zone). Values > 1.0 suggest ETH is expensive (Rotation Zone)."
      />
      
      <MetricCard 
        label="BTC Dominance"
        value={`${data.btcDominance.toFixed(1)}%`}
        subValue="Market Cap Share"
        icon={<Percent size={18} />}
        trend={domTrend}
        tooltip="Bitcoin's percentage share of the total crypto market cap. High dominance (>50%) typically signals 'Risk Off' (BTC leads). Low dominance signals 'Risk On' (Alt/ETH strength)."
      />

      <MetricCard 
        label="Technical Trend"
        value={data.currentRatio > data.ma200 ? "Bullish" : "Bearish"}
        subValue={`vs 200 DMA (${data.ma200.toFixed(5)})`}
        icon={<BarChart3 size={18} />}
        trend={data.currentRatio > data.ma200 ? 'bullish' : 'bearish'}
        tooltip="Momentum relative to the 200-Day Moving Average. Trading above the 200 DMA confirms a long-term bullish trend for Ethereum relative to Bitcoin."
      />
    </div>
  );
};

export default MetricsGrid;