import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, RefreshCw, DollarSign, Activity, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface AIEvent {
  id: string;
  type: 'detection' | 'policy' | 'action' | 'recovery';
  message: string;
  amount?: number;
  probability?: number;
}

const mockEvents: AIEvent[] = [
  { id: '1', type: 'detection', message: 'Payment degradation detected', amount: 4999, probability: 0.93 },
  { id: '2', type: 'policy', message: 'Policy check: Smart Retry Allowed' },
  { id: '3', type: 'action', message: 'Executing dynamic retry strategy' },
  { id: '4', type: 'recovery', message: 'Payment successfully recovered', amount: 4999 },
];

export function AIEventStream() {
  const [events, setEvents] = useState<AIEvent[]>([]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < mockEvents.length) {
        setEvents(prev => [...prev.slice(-3), mockEvents[index]]);
        index++;
      } else {
        index = 0;
        setEvents([]);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type?: string) => {
    switch (type) {
      case 'detection': return <Brain className="h-4 w-4 text-yellow-400" />;
      case 'policy': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'action': return <RefreshCw className="h-4 w-4 text-pink-400 animate-spin" />;
      case 'recovery': return <DollarSign className="h-4 w-4 text-green-400" />;
      default: return <Activity className="h-4 w-4 text-neutral-400" />;
    }
  };

  return (
    <div className="bg-[#0a0a0a]/95 border border-neutral-800 hover:border-green-500/50 transition-all duration-300 rounded-2xl p-5 h-64 overflow-hidden relative shadow-[0_0_30px_rgba(0,0,0,0.9)] backdrop-blur-xl group">
      
      {/* Background Neon Accent Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all pointer-events-none" />

      {/* Top and Bottom Gradient Fades for Smooth Stream Effect */}
      <div className="absolute top-0 left-0 w-full h-10 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
      
      {/* Header Indicator */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-800/80 text-[10px] font-mono text-neutral-400 z-20 relative">
        <span className="flex items-center gap-1.5 text-green-400 font-semibold tracking-wider">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" /> LIVE AGENT STREAM
        </span>
        <span className="text-neutral-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-yellow-400" /> AUTONOMOUS FEED
        </span>
      </div>

      <div className="flex flex-col justify-end h-[calc(100%-2rem)] space-y-2.5 overflow-hidden relative z-20">
        <AnimatePresence mode="popLayout">
          {events.map((event) => {
            if (!event) return null;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                layout
                className="flex items-center gap-3 bg-[#121214] border border-neutral-800/80 hover:border-neutral-700 p-3 rounded-xl shadow-lg transition-all"
              >
                <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 shadow-inner">
                  {getIcon(event?.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white font-mono truncate">{event?.message}</p>
                  {event?.probability !== undefined && (
                    <p className="text-[10px] text-yellow-400 font-mono mt-0.5">Confidence: {(event.probability * 100).toFixed(0)}%</p>
                  )}
                </div>
                {event?.amount !== undefined && (
                  <div className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    event.type === 'recovery' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                      : 'bg-neutral-900 text-neutral-200 border-neutral-800'
                  }`}>
                    {event.type === 'recovery' ? '+' : ''}{formatCurrency(event.amount)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}