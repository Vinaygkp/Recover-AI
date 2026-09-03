import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'metric' | 'table' | 'chart';
}

export function Skeleton({ className, variant = 'text', ...props }: SkeletonProps) {
  const variants = {
    text: 'h-4 w-3/4 rounded-md bg-neutral-800/80 animate-pulse',
    card: 'h-32 w-full rounded-2xl bg-neutral-900/80 border border-neutral-800/80 animate-pulse shadow-inner',
    metric: 'h-24 w-full rounded-2xl bg-neutral-900/80 border border-neutral-800/80 animate-pulse shadow-inner',
    table: 'h-64 w-full rounded-2xl bg-neutral-900/80 border border-neutral-800/80 animate-pulse shadow-inner',
    chart: 'h-80 w-full rounded-2xl bg-neutral-900/80 border border-neutral-800/80 animate-pulse shadow-inner'
  };

  return (
    <div
      className={cn('relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent', variants[variant], className)}
      {...props}
    />
  );
}