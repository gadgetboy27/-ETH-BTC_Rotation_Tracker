import React from 'react';
import { Info, CheckCircle2, Circle, HelpCircle } from 'lucide-react';
import { AnalysisResult } from '../types';

interface LogicRowProps {
  label: string;
  subLabel: string;
  isEth: boolean;
  isBtc: boolean;
  tooltip: string;
}

const LogicRow: React.FC<LogicRowProps> = ({ label, subLabel, isEth, isBtc, tooltip }) => {
  const getStatusIcon = (condition: boolean, type: 'eth' | 'btc') => {
    if (condition) return <CheckCircle2 className={`w-4 h-4 ${type === 'eth' ? 'text-blue-500' : 'text-orange-500'}`} />;
    return <Circle className="w-4 h-4 text-zinc-700" />;
  };

  return (
    <div className="group/row relative grid grid-cols-12 items-center text-sm py-3 hover:bg-white/5 rounded-lg px-3 transition-colors -mx-3 border-b border-white/5 last:border-0">
      {/* Tooltip */}
      <div className="absolute z-[60] bottom-full left-4 mb-2 w-72 p-4 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl shadow-2xl opacity-0 translate-y-2 group-hover/row:translate-y-0 group-hover/row:opacity-100 transition-all duration-200 pointer-events-none">
        <p className="font-semibold text-white mb-1">{label}</p>
        <p className="leading-relaxed text-zinc-400">{tooltip}</p>
        <div className="absolute top-full left-6 -mt-[1px] border-4 border-transparent border-t-zinc-800"></div>
      </div>

      <div className="col-span-6 text-zinc-300 flex items-center gap-2">
        <div className="flex-1">
          <span className="block font-medium text-zinc-200">{label}</span>
          <span className="text-xs text-zinc-500 font-mono">{subLabel}</span>
        </div>
        <HelpCircle size={14} className="text-zinc-600 opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0" />
      </div>
      <div className="col-span-3 flex justify-center">{getStatusIcon(isEth, 'eth')}</div>
      <div className="col-span-3 flex justify-center">{getStatusIcon(isBtc, 'btc')}</div>
    </div>
  );
};

const StrategyPanel: React.FC<{ data: AnalysisResult }> = ({ data }) => {
  const currentMonth = new Date().getMonth() + 1;
  const isEthSeason = [4, 5, 6].includes(currentMonth);
  const isBtcSeason = [1, 2, 3, 9].includes(currentMonth);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {/* Logic Breakdown */}
      <div className="lg:col-span-2 bg-surface border border-surfaceHighlight rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-6">
          <Info size={18} className="text-primary" />
          Scoring Logic Breakdown
        </h3>
        
        <div className="space-y-1">
          <div className="grid grid-cols-12 text-xs font-bold text-zinc-500 uppercase tracking-wider pb-3 border-b border-surfaceHighlight mb-2 px-3">
            <div className="col-span-6">Criterion</div>
            <div className="col-span-3 text-center">ETH Impact</div>
            <div className="col-span-3 text-center">BTC Impact</div>
          </div>

          <LogicRow 
            label="Trend vs 200 DMA"
            subLabel={`Ratio: ${data.currentRatio.toFixed(5)} vs ${data.ma200.toFixed(5)}`}
            isEth={data.currentRatio > data.ma200}
            isBtc={data.currentRatio <= data.ma200}
            tooltip="The 200-day Simple Moving Average (SMA) acts as a major long-term trend divider. When the ETH/BTC ratio is above this line, the long-term trend favors Ethereum. Below it favors Bitcoin."
          />

          <LogicRow 
            label="Statistical Value (Z-Score)"
            subLabel={`Z: ${data.zScore.toFixed(2)}`}
            isEth={data.zScore < -1}
            isBtc={data.zScore > 1}
            tooltip="Measures how extreme the current price is compared to the 2-year average. Z-Scores below -1.0 indicate ETH is historically cheap (Accumulation Zone). Above 1.0 indicates ETH is expensive (Rotation Zone)."
          />

          <LogicRow 
            label="Momentum Cross"
            subLabel="50 DMA vs 200 DMA"
            isEth={data.ma50 > data.ma200}
            isBtc={data.ma50 <= data.ma200}
            tooltip="Compares short-term (50-day) momentum to the long-term (200-day) trend. A 'Golden Cross' (50 > 200) signals accelerating bullish momentum for ETH, adding +1 to the score."
          />

          <LogicRow 
            label="Market Dominance"
            subLabel={`BTC.D: ${data.btcDominance.toFixed(1)}%`}
            isEth={data.btcDominance < 50}
            isBtc={data.btcDominance >= 50}
            tooltip="Bitcoin Dominance measures BTC's share of the total crypto market cap. High dominance (>50%) typically signals 'Risk Off' (BTC leads). Low dominance signals 'Risk On' (Altcoin/ETH strength)."
          />

          <LogicRow 
            label="Seasonality"
            subLabel={`Month: ${new Date().toLocaleString('default', { month: 'short' })}`}
            isEth={isEthSeason}
            isBtc={isBtcSeason}
            tooltip="Historical probability bias based on time of year. Q2 (Apr-Jun) and Q4 often favor ETH rallies, while Q1 and September historically favor Bitcoin safety."
          />
        </div>
      </div>

      {/* Side Summary */}
      <div className="bg-surface border border-surfaceHighlight rounded-2xl p-6 flex flex-col justify-between">
        <div>
           <h3 className="text-lg font-semibold text-zinc-100 mb-4">Framework</h3>
           <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
             This tool uses a quantitative framework to determine relative value between ETH and BTC. It combines mean reversion (Z-Score) with trend following (MAs) and market regime (Dominance).
           </p>
           
           <div className="space-y-4">
             <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-zinc-500 font-medium">Rotation Threshold</span>
                 <span className="text-zinc-300 font-mono font-bold">+3 Points</span>
               </div>
               <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-600 w-full opacity-20"></div>
               </div>
               <p className="text-xs text-zinc-500 mt-2">
                 A 3-point differential is required to trigger a hard rotation signal, preventing over-trading during noise.
               </p>
             </div>
           </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">Data Source</span>
            <span className="text-zinc-300 font-medium">Multi-Feed API</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-zinc-500">Lookback Period</span>
            <span className="text-zinc-300 font-medium">730 Days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyPanel;