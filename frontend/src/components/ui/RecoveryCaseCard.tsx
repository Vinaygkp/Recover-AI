import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { StatusIndicator } from './StatusIndicator';
import { formatCurrency, formatPercentage, timeAgo } from '../../lib/utils';
import { RecoveryCase } from '../../types';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface RecoveryCaseCardProps {
  data: RecoveryCase;
  onSelect?: (id: string) => void;
}

export function RecoveryCaseCard({ data, onSelect }: RecoveryCaseCardProps) {
  const probability = (data.recovery_probability !== undefined && data.recovery_probability !== null)
    ? data.recovery_probability 
    : (((data as unknown) as Record<string, unknown>).probability !== undefined ? Number(((data as unknown) as Record<string, unknown>).probability) : 0.5);

  const priorityText = (data.priority || 'medium').toUpperCase();

  const handleCardClick = () => {
    if (onSelect) onSelect(data.id);
  };

  return (
    <Card 
      variant="interactive" 
      onClick={handleCardClick}
      className="p-6 flex flex-col group relative overflow-hidden cursor-pointer"
    >
      
      {/* Background Neon Glow Accent */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all pointer-events-none" />

      {/* Header Badges & ID */}
      <div className="flex justify-between items-start gap-2 mb-5 relative z-10">
        <div className="flex gap-2 items-center flex-wrap">
          <Badge variant={data.priority === 'high' ? 'error' : data.priority === 'medium' ? 'warning' : 'neutral'}>
            {priorityText} PRIORITY
          </Badge>
          <span className="text-[11px] text-neutral-500 font-mono shrink-0">
            #{data.transaction_id ? data.transaction_id.slice(0, 8) : 'case'}
          </span>
        </div>
        <div className="shrink-0">
          <StatusIndicator status={data.status} />
        </div>
      </div>

      {/* Amount and Timestamp */}
      <div className="mb-5 flex items-end justify-between relative z-10">
        <div>
          <span className="text-xs text-neutral-400 font-mono block mb-1">Amount at Risk</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {formatCurrency(data.amount)}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-neutral-400 font-mono block mb-1">Failed</span>
          <span className="text-xs font-mono text-neutral-300">{timeAgo(data.created_at)}</span>
        </div>
      </div>

      {/* AI Confidence Meter */}
      <div className="mb-5 bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-xl relative z-10">
        <div className="flex justify-between text-xs font-mono mb-2">
          <span className="text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Brain className="h-3.5 w-3.5 text-green-400 animate-pulse" /> AI Confidence
          </span>
          <span className="font-bold text-green-400">{formatPercentage(probability)}</span>
        </div>
        <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, probability * 100))}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              probability > 0.8 
                ? 'bg-gradient-to-r from-green-600 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                : probability > 0.5 
                ? 'bg-gradient-to-r from-amber-600 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                : 'bg-gradient-to-r from-red-600 to-pink-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
            }`}
          />
        </div>
      </div>

      {/* AI Recommendation Box */}
      <div className="bg-neutral-900/90 rounded-xl p-4 mb-5 border border-neutral-800 shadow-inner relative z-10">
        <p className="text-[10px] text-yellow-400 font-mono uppercase tracking-widest mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI Recommendation
        </p>
        <p className="text-xs font-semibold text-white font-mono tracking-tight leading-relaxed">
          {data.recommended_action || String(((data as unknown) as Record<string, unknown>).action || 'retry')}
        </p>
      </div>

      {/* Action Footer */}
      <div className="mt-auto flex gap-2 relative z-10">
        <Button 
          variant="secondary" 
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(data.id);
          }}
          className="w-full text-xs font-mono uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white shadow-md hover:border-green-500/50 transition-all flex items-center justify-center gap-2 group-hover:border-green-500/40 cursor-pointer"
        >
          Review Case <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
}