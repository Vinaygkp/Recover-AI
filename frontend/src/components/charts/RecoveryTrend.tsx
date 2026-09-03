import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer } from '../ui/ChartContainer';

interface TrendItem {
  date: string;
  successful: number;
  pending: number;
  failed: number;
  [key: string]: unknown;
}

interface RecoveryTrendProps {
  data?: TrendItem[];
  isLoading?: boolean;
}

export function RecoveryTrend({ data, isLoading }: RecoveryTrendProps) {
  // Fallback sample data if none is passed, keeping the UI visually stunning
  const chartData: TrendItem[] = (data && data.length > 0) ? data : [
    { date: 'Mon', successful: 120, pending: 25, failed: 15 },
    { date: 'Tue', successful: 200, pending: 30, failed: 10 },
    { date: 'Wed', successful: 150, pending: 40, failed: 20 },
    { date: 'Thu', successful: 280, pending: 20, failed: 8 },
    { date: 'Fri', successful: 320, pending: 35, failed: 12 },
    { date: 'Sat', successful: 220, pending: 15, failed: 5 },
    { date: 'Sun', successful: 290, pending: 25, failed: 9 },
  ];

  return (
    <ChartContainer title="Daily Recovery Status Trend" isLoading={isLoading} height={320}>
      <div className="w-full h-full flex items-center justify-center relative group">
        
        {/* Subtle background glow effect on container hover */}
        <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#737373" 
              fontSize={11} 
              fontFamily="monospace"
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#737373" 
              fontSize={11} 
              fontFamily="monospace"
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0a0a0a', 
                borderColor: '#262626', 
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.9)',
                padding: '10px 14px'
              }} 
              itemStyle={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '12px' }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '12px' }} 
              formatter={(value) => <span className="text-neutral-300 font-medium hover:text-white transition-colors">{value}</span>}
            />
            <Bar 
              dataKey="successful" 
              stackId="a" 
              fill="#22c55e" 
              name="Successful" 
              radius={[0, 0, 4, 4]} 
              className="transition-all duration-300 hover:opacity-85 cursor-pointer"
            />
            <Bar 
              dataKey="pending" 
              stackId="a" 
              fill="#eab308" 
              name="Pending" 
              className="transition-all duration-300 hover:opacity-85 cursor-pointer"
            />
            <Bar 
              dataKey="failed" 
              stackId="a" 
              fill="#ef4444" 
              name="Failed" 
              radius={[4, 4, 0, 0]} 
              className="transition-all duration-300 hover:opacity-85 cursor-pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}