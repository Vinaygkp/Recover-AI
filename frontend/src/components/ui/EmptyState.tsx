import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center bg-[#0c0c0e] border border-neutral-800 rounded-2xl relative overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.8)]", className)}>
      
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-3xl" />

      {/* Icon Badge with Neon Border */}
      <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-5 shadow-inner relative z-10 group-hover:border-green-500/40 transition-colors">
        <Icon className="h-7 w-7 text-green-400 animate-pulse" />
      </div>

      <h3 className="text-base font-bold text-white mb-2 tracking-tight font-mono relative z-10">{title}</h3>
      <p className="text-xs text-neutral-400 max-w-sm mb-6 leading-relaxed font-mono relative z-10">{description}</p>
      
      {actionLabel && onAction && (
        <div className="relative z-10">
          <Button 
            onClick={onAction} 
            variant="secondary" 
            className="text-xs font-mono uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white shadow-md hover:border-green-500/50 transition-all cursor-pointer"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}