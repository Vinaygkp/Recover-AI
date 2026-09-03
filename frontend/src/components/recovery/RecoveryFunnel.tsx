import React from 'react';
import { Card } from '../ui/Card';
import { formatCompactCurrency } from '../../lib/utils';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface FunnelStage {
  label: string;
  value: number;
  percentage: number;
  color: string;
  [key: string]: unknown;
}

interface RecoveryFunnelProps {
  data?: FunnelStage[];
}

export function RecoveryFunnel({ data }: RecoveryFunnelProps) {
  const chartData: FunnelStage[] = (data && data.length > 0) ? data : [
    { label: 'Detected At Risk', value: 842500, percentage: 100, color: 'bg-red-500' },
    { label: 'Diagnosed / Actionable', value: 650000, percentage: 77, color: 'bg-amber-500' },
    { label: 'Policy Verified', value: 480000, percentage: 57, color: 'bg-yellow-400' },
    { label: 'Successfully Recovered', value: 317400, percentage: 38, color: 'bg-green-500' },
  ];

  const maxVal = chartData[0]?.value || 1;

  return (
    <Card className="p-7 bg-[#0c0c0e] border border-neutral-800 hover:border-green-500/40 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-2xl relative overflow-hidden group">
      
      {/* Background Neon Accent Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-green-500/10 transition-all duration-500" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-green-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> RECOVERY FUNNEL PIPELINE
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">Conversion & Recovery Flow</h3>
        </div>
        <div className="px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400">
          REAL-TIME STAGES
        </div>
      </div>
      
      {/* Funnel Stages */}
      <div className="space-y-4 relative z-10">
        {chartData.map((stage, i) => {
          const width = Math.max((stage.value / maxVal) * 100, 8); // min 8% width for visual clarity
          return (
            <div key={i} className="relative group/bar">
              <div className="flex justify-between items-end mb-1.5 font-mono">
                <span className="text-xs text-neutral-300 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 group-hover/bar:bg-green-400 transition-colors" />
                  {stage.label}
                </span>
                <span className="text-xs font-bold text-white tracking-wide">{formatCompactCurrency(stage.value)}</span>
              </div>

              {/* Bar track container */}
              <div className="h-9 w-full bg-neutral-900/90 border border-neutral-800/80 rounded-xl overflow-hidden flex items-center px-3 relative shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                  className={`absolute left-0 top-0 h-full rounded-xl opacity-20 ${stage.color}`}
                />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                  className={`absolute left-0 top-1 bottom-1 rounded-lg ${stage.color} shadow-[0_0_15px_rgba(34,197,94,0.3)]`}
                />
                <div className="relative z-10 w-full flex justify-between items-center text-xs font-mono font-bold text-white px-2">
                  <span className="drop-shadow">{stage.percentage}% Conversion</span>
                  <span className="text-[10px] opacity-70">Stage 0{i+1}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}