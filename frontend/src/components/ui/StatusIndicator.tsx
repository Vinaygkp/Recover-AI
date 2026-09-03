import React from 'react';
import { cn } from '../../lib/utils';
import { STATUS_LABELS } from '../../lib/constants';

interface StatusIndicatorProps {
  status: string;
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({ status, showLabel = true, className }: StatusIndicatorProps) {
  const isPulsing = status === 'detected' || status === 'in_progress' || status === 'pending';
  
  let dotColor = 'bg-neutral-500 shadow-[0_0_8px_rgba(115,115,115,0.8)]';
  if (status === 'detected' || status === 'info') dotColor = 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]';
  if (status === 'in_progress' || status === 'manual_review' || status === 'pending') dotColor = 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]';
  if (status === 'recovered' || status === 'success') dotColor = 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]';
  if (status === 'failed') dotColor = 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]';

  return (
    <div className={cn("inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 shadow-inner", className)}>
      <div className="relative flex h-2 w-2">
        {isPulsing && (
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotColor)}></span>
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColor)}></span>
      </div>
      {showLabel && (
        <span className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider">
          {STATUS_LABELS[status] || status.replace('_', ' ')}
        </span>
      )}
    </div>
  );
}