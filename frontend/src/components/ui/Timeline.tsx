import React from 'react';
import { motion } from 'framer-motion';
import { cn, formatDate, formatTime } from '../../lib/utils';
import { staggerContainer, slideUp } from '../../animations/variants';
import { Sparkles, CheckCircle2, AlertTriangle, XCircle, Info, Clock } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  type?: 'success' | 'warning' | 'error' | 'info' | 'default';
  icon?: React.ReactNode;
}

interface TimelineProps {
  events?: TimelineEvent[];
  className?: string;
}

export function Timeline({ events = [], className }: TimelineProps) {
  const typeColors = {
    success: 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
    error: 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]',
    default: 'bg-neutral-900 text-neutral-400 border-neutral-700 shadow-inner'
  };

  const lineColors = {
    success: 'bg-gradient-to-b from-green-500/50 to-neutral-800',
    warning: 'bg-gradient-to-b from-amber-500/50 to-neutral-800',
    error: 'bg-gradient-to-b from-red-500/50 to-neutral-800',
    info: 'bg-gradient-to-b from-blue-500/50 to-neutral-800',
    default: 'bg-neutral-800'
  };

  const defaultIcons = {
    success: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    error: <XCircle className="w-3.5 h-3.5 text-red-400" />,
    info: <Info className="w-3.5 h-3.5 text-blue-400" />,
    default: <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
  };

  return (
    <motion.div 
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={cn("relative pl-6 space-y-8 py-2", className)}
    >
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const type = event.type || 'default';
        
        return (
          <motion.div key={event.id} variants={slideUp} className="relative group">
            {/* Vertical glowing connecting line */}
            {!isLast && (
              <div className={cn("absolute top-7 left-[13px] bottom-[-32px] w-0.5 transition-all duration-300", lineColors[type])} />
            )}
            
            <div className="flex gap-4 items-start">
              {/* Event Icon Node */}
              <div className={cn(
                "relative z-10 flex-shrink-0 w-7 h-7 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                typeColors[type]
              )}>
                {event.icon ? (
                  <div className="scale-90">{event.icon}</div>
                ) : (
                  defaultIcons[type]
                )}
              </div>
              
              {/* Event Content Box */}
              <div className="flex-1 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] group-hover:border-green-500/40 transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-1.5">
                  <h4 className="text-xs font-mono font-bold text-white tracking-wide">{event.title}</h4>
                  <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800/80">
                    <Clock className="w-3 h-3 text-green-400" />
                    <span>{formatDate(event.timestamp)}</span>
                    <span className="text-neutral-600">|</span>
                    <span>{formatTime(event.timestamp)}</span>
                  </div>
                </div>
                {event.description && (
                  <p className="text-xs text-neutral-300 leading-relaxed font-mono mt-2">{event.description}</p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}