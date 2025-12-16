import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { HistoricalDataPoint } from '../types';

interface RatioChartProps {
  data: HistoricalDataPoint[];
}

const RatioChart: React.FC<RatioChartProps> = ({ data }) => {
  // formatting for chart tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-zinc-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="text-zinc-400 mb-2 font-mono">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-zinc-300">{entry.name}:</span>
              <span className="font-mono font-bold text-white">{Number(entry.value).toFixed(5)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface border border-surfaceHighlight rounded-2xl p-6 mt-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Historical Ratio Analysis</h3>
          <p className="text-sm text-zinc-500">ETH/BTC Price Ratio vs Moving Averages</p>
        </div>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#52525b" 
              tick={{ fontSize: 12 }} 
              tickMargin={10} 
              minTickGap={30}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
              }}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#52525b" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(val) => val.toFixed(4)}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <Line 
              type="monotone" 
              dataKey="ratio" 
              name="ETH/BTC Ratio" 
              stroke="#627eea" 
              strokeWidth={2} 
              dot={false} 
              activeDot={{ r: 6, fill: '#627eea' }}
            />
            <Line 
              type="monotone" 
              dataKey="ma50" 
              name="50 DMA" 
              stroke="#10b981" 
              strokeWidth={1.5} 
              dot={false} 
              strokeDasharray="5 5"
            />
             <Line 
              type="monotone" 
              dataKey="ma200" 
              name="200 DMA" 
              stroke="#f59e0b" 
              strokeWidth={1.5} 
              dot={false} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RatioChart;
