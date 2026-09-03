import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer } from '../ui/ChartContainer';

// Vibrant neon color palette
const COLORS = ['#00D26A', '#FFB020', '#FF4C4C', '#06b6d4', '#9333ea', '#3B82F6'];

interface FailureData {
  name?: string;
  _id?: string;
  value?: number;
  count?: number;
  total_amount?: number;
  [key: string]: unknown;
}

interface FailureDistributionProps {
  data?: FailureData[];
  isLoading?: boolean;
}

interface PayloadItem {
  name: string;
  value: number | string;
  fill?: string;
  color?: string;
  [key: string]: unknown;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: PayloadItem;
    name: string;
    value: number | string;
    dataKey?: string;
    fill?: string;
    color?: string;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0];
    const rawName = data.name || data.payload?.name || 'Failure Reason';
    const val = data.value ?? data.payload?.value ?? 0;
    const color = data.fill || data.color || data.payload?.fill || '#00D26A';

    return (
      <div className="bg-[#0c0c0e] border border-neutral-700/90 p-3 px-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-50 pointer-events-none text-white backdrop-blur-2xl">
        <p className="text-xs font-mono font-bold text-white flex items-center gap-2">
          <span className="w-3 h-3 rounded-full inline-block shrink-0 shadow-sm" style={{ backgroundColor: color }} />
          <span className="text-white font-bold">{rawName}:</span>
          <span className="text-amber-400 font-extrabold text-sm">{val}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function FailureDistribution({ data, isLoading }: FailureDistributionProps) {
  // Map incoming backend format (_id, count/total_amount) or standard format (name, value)
  const chartData = (data && data.length > 0)
    ? data.map((item) => {
        const rawName = item.name || item._id || 'Payment Failure';
        const formattedName = typeof rawName === 'string' ? rawName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Payment Failure';
        const val = item.value ?? item.count ?? item.total_amount ?? 1;
        return {
          name: formattedName,
          value: Number(val)
        };
      })
    : [
        { name: 'Card Expired', value: 45 },
        { name: 'Insufficient Funds', value: 30 },
        { name: 'Gateway Timeout', value: 15 },
        { name: 'Overdue Receivable', value: 10 }
      ];

  return (
    <ChartContainer title="Failure Reasons Distribution" isLoading={isLoading} height={320}>
      <div className="w-full h-full flex flex-col items-center justify-center relative group">
        
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-green-500/5 blur-2xl rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <ResponsiveContainer width="100%" height={260}>
          <PieChart margin={{ top: 10, right: 10, bottom: 25, left: 10 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  className="transition-all duration-300 hover:opacity-80 hover:scale-[1.03] cursor-pointer origin-center"
                />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip />} 
              wrapperStyle={{ zIndex: 100 }} 
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} 
              formatter={(value) => <span className="text-white font-medium hover:text-amber-300 transition-colors">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}