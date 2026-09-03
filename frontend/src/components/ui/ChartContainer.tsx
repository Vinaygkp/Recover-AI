import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import { Skeleton } from './Skeleton';

interface ChartContainerProps {
  children: React.ReactElement;
  title?: string;
  height?: number | string;
  isLoading?: boolean;
  className?: string;
}

export function ChartContainer({ children, title, height = 300, isLoading, className }: ChartContainerProps) {
  if (isLoading) {
    return (
      <div className={cn("w-full flex flex-col bg-[#0c0c0e] border border-neutral-800 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)]", className)}>
        {title && <div className="mb-4 h-6 w-36 bg-neutral-800 rounded-xl animate-pulse" />}
        <Skeleton variant="chart" style={{ height }} className="bg-neutral-900/50 rounded-xl border border-neutral-800/80" />
      </div>
    );
  }

  return (
    <div className={cn("w-full flex flex-col bg-[#0c0c0e] border border-neutral-800 hover:border-green-500/40 transition-all duration-300 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative overflow-hidden group", className)}>
      
      {/* Subtle background glow effect on hover */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-green-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-green-500/10 transition-all duration-500" />

      {title && (
        <div className="flex items-center justify-between mb-5 relative z-10">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {title}
          </h3>
        </div>
      )}
      
      <div style={{ height }} className="w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}