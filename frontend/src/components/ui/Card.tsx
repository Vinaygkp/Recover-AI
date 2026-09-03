import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const variants = {
    default: 'bg-[#0c0c0e] border-neutral-800 text-white shadow-lg',
    elevated: 'bg-[#121215] border-neutral-700/80 shadow-[0_15px_40px_rgba(0,0,0,0.8)]',
    interactive: 'bg-[#0c0c0e] border-neutral-800 hover:border-green-500/50 hover:bg-[#111115] transition-all duration-300 cursor-pointer hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_40px_rgba(34,197,94,0.1)]'
  };

  return (
    <div className={cn('rounded-2xl border backdrop-blur-xl relative overflow-hidden', variants[variant], className)} {...props}>
      {children}
    </div>
  );
}