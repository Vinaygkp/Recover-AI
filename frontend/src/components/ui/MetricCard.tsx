import React from 'react';
import { Card } from './Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, change, icon }: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  
  return (
    <Card variant="interactive" className="p-6 relative overflow-hidden group">
      
      {/* Background Neon Glow Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all pointer-events-none" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 group-hover:text-neutral-300 transition-colors">
          {label}
        </p>
        {icon && (
          <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-green-400 shadow-inner group-hover:border-green-500/40 transition-colors">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline space-x-3 relative z-10">
        <motion.h3 
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {value}
        </motion.h3>
        
        {change !== undefined && (
          <span className={`inline-flex items-center text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
            isPositive 
              ? 'text-green-400 bg-green-500/10 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
              : 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
          }`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </Card>
  );
}