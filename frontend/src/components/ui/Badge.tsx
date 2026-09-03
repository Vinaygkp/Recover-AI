import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  styleType?: 'filled' | 'outline' | 'dot';
}

export function Badge({ className, variant = 'neutral', styleType = 'outline', children, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-mono tracking-wider font-semibold transition-all duration-200 shadow-sm';
  
  const variants = {
    success: {
      filled: 'bg-green-500/15 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]',
      outline: 'border border-green-500/40 text-green-400 hover:bg-green-500/10',
      dot: 'text-green-300 bg-neutral-900 border border-neutral-800'
    },
    warning: {
      filled: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      outline: 'border border-amber-500/40 text-amber-400 hover:bg-amber-500/10',
      dot: 'text-amber-300 bg-neutral-900 border border-neutral-800'
    },
    error: {
      filled: 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
      outline: 'border border-red-500/40 text-red-400 hover:bg-red-500/10',
      dot: 'text-red-300 bg-neutral-900 border border-neutral-800'
    },
    info: {
      filled: 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
      outline: 'border border-blue-500/40 text-blue-400 hover:bg-blue-500/10',
      dot: 'text-blue-300 bg-neutral-900 border border-neutral-800'
    },
    neutral: {
      filled: 'bg-neutral-800 text-neutral-200 border border-neutral-700',
      outline: 'border border-neutral-700 text-neutral-300 hover:bg-neutral-900',
      dot: 'text-neutral-300 bg-neutral-900 border border-neutral-800'
    }
  };

  const dotColors = {
    success: 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]',
    warning: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    error: 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    info: 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]',
    neutral: 'bg-neutral-400 shadow-[0_0_8px_rgba(163,163,163,0.8)]'
  };

  return (
    <div className={cn(baseStyles, variants[variant][styleType], className)} {...props}>
      {styleType === 'dot' && (
        <span className="mr-2 flex h-2 w-2 relative">
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotColors[variant])}></span>
          <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColors[variant])}></span>
        </span>
      )}
      {children}
    </div>
  );
}