import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from '../ui/ChartContainer';

interface RevenueItem {
  date: string;
  atRisk: number;
  recovered: number;
  [key: string]: unknown;
}

interface RevenueChartProps {
  data?: RevenueItem[];
  isLoading?: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  // Fallback data if none provided to keep the chart visually stunning
  const chartData: RevenueItem[] = (data && data.length > 0) ? data : [
    { date: '01 Jan', atRisk: 45000, recovered: 12000 },
    { date: '05 Jan', atRisk: 62000, recovered: 28000 },
    { date: '10 Jan', atRisk: 38000, recovered: 34000 },
    { date: '15 Jan', atRisk: 85000, recovered: 51000 },
    { date: '20 Jan', atRisk: 52000, recovered: 48000 },
    { date: '25 Jan', atRisk: 74000, recovered: 65000 },
    { date: '30 Jan', atRisk: 91000, recovered: 82000 },
  ];

  return (
    <ChartContainer title="Revenue Recovery & Risk Trend" isLoading={isLoading} height={350}>
      <div className="w-full h-full flex items-center justify-center relative group">
        
        {/* Subtle background glow effect on container hover */}
        <div className="absolute inset-0 bg-green-500/5 blur-2xl rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorAtRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => `₹${value/1000}k`} 
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
            />
            <Area 
              type="monotone" 
              dataKey="atRisk" 
              stroke="#ef4444" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorAtRisk)" 
              name="Revenue at Risk" 
              className="transition-all duration-300"
            />
            <Area 
              type="monotone" 
              dataKey="recovered" 
              stroke="#22c55e" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorRecovered)" 
              name="Recovered" 
              className="transition-all duration-300"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}