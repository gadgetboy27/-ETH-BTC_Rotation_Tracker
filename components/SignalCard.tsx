import React from 'react';
import { ArrowRightLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SignalCardProps {
  signal: 'HOLD ETH' | 'HOLD BTC' | 'NEUTRAL';
  ethScore: number;
  btcScore: number;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, ethScore, btcScore }) => {
  let bgColor = 'bg-surfaceHighlight';
  let borderColor = 'border-zinc-700';
  let textColor = 'text-zinc-100';
  let subText = 'Market conditions are mixed. Maintain current allocation.';
  let Icon = Minus;

  if (signal === 'HOLD ETH') {
    bgColor = 'bg-blue-900/30';
    borderColor = 'border-blue-500/50';
    textColor = 'text-blue-400';
    subText = 'Statistical indicators favor Ethereum outperformance relative to Bitcoin.';
    Icon = TrendingUp;
  } else if (signal === 'HOLD BTC') {
    bgColor = 'bg-orange-900/30';
    borderColor = 'border-orange-500/50';
    textColor = 'text-orange-400';
    subText = 'Bitcoin shows stronger relative strength or lower risk profile currently.';
    Icon = TrendingDown; // Down relative to Ratio (BTC up)
  }

  const confidence = Math.abs(ethScore - btcScore);
  const confidenceLevel = confidence >= 5 ? 'High' : confidence >= 3 ? 'Medium' : 'Low';

  // Helper to determine bar colors based on level
  const getBarColor = (barIndex: number) => {
    if (confidenceLevel === 'High') return 'bg-green-500';
    if (confidenceLevel === 'Medium') return barIndex <= 2 ? 'bg-yellow-500' : 'bg-zinc-800';
    // Low
    return barIndex === 1 ? 'bg-zinc-400' : 'bg-zinc-800';
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${borderColor} ${bgColor} p-6 shadow-xl transition-all duration-300`}>
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <ArrowRightLeft size={120} />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400 mb-1">Current Directive</h2>
          <div className="flex items-center gap-3">
            <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${textColor}`}>
              {signal}
            </h1>
          </div>
          <p className="mt-3 max-w-lg text-zinc-300 text-sm leading-relaxed">
            {subText}
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 bg-black/20 p-4 rounded-lg border border-white/5 backdrop-blur-sm min-w-[200px]">
          <div className="flex flex-col items-end w-full">
            <div className="flex items-center justify-end gap-2 w-full">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Confidence</span>
              <span className={`text-sm font-bold ${
                  confidenceLevel === 'High' ? 'text-green-400' : 
                  confidenceLevel === 'Medium' ? 'text-yellow-400' : 'text-zinc-400'
              }`}>
                {confidenceLevel}
              </span>
            </div>
            
            <div className="flex gap-1 mt-1.5 justify-end w-full">
              <div className={`h-1.5 flex-1 rounded-l-full ${getBarColor(1)}`}></div>
              <div className={`h-1.5 flex-1 ${getBarColor(2)}`}></div>
              <div className={`h-1.5 flex-1 rounded-r-full ${getBarColor(3)}`}></div>
            </div>
          </div>

          <div className="w-full h-px bg-white/10 my-3"></div>

          <div className="flex items-center justify-between w-full text-xs font-mono px-1">
            <div className="flex flex-col items-center">
               <span className="text-eth font-bold text-lg">{ethScore}</span>
               <span className="text-zinc-500">ETH Pts</span>
            </div>
            <div className="h-8 w-px bg-zinc-700 mx-4"></div>
            <div className="flex flex-col items-center">
               <span className="text-btc font-bold text-lg">{btcScore}</span>
               <span className="text-zinc-500">BTC Pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;