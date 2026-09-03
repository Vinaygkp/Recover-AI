import React from 'react';
import { Brain, CheckCircle, XCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { Card } from './Card';
import { formatPercentage } from '../../lib/utils';
import { motion } from 'framer-motion';

interface PolicyCheck {
  name: string;
  passed: boolean;
  [key: string]: unknown;
}

interface AIInsightCardProps {
  diagnosis: string;
  probability: number;
  recommendedAction: string;
  explanation: string;
  policyChecks?: PolicyCheck[];
}

export function AIInsightCard({ diagnosis, probability, recommendedAction, explanation, policyChecks = [] }: AIInsightCardProps) {
  return (
    <Card className="overflow-hidden border border-green-500/30 bg-[#0c0c0e] hover:border-green-500/65 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-2xl relative group">
      
      {/* Background Neon Glow Accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-green-500/10 transition-all duration-500" />
      
      {/* Absolute Header Badge */}
      <div className="absolute top-0 right-0 p-5 z-20">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
          <Brain className="h-3.5 w-3.5 text-green-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-green-400 tracking-wider uppercase">AI Insight</span>
        </div>
      </div>
      
      <div className="p-7 relative z-10">
        
        {/* Diagnosis Heading */}
        <h3 className="text-xl font-bold text-white mb-6 pr-28 tracking-tight">{diagnosis}</h3>
        
        {/* Recovery Probability Progress Bar */}
        <div className="mb-6 bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-neutral-400 uppercase tracking-wider">Recovery Probability</span>
            <span className="font-bold text-green-400">{formatPercentage(probability)}</span>
          </div>
          <div className="h-2.5 w-full bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, probability * 100))}%` }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-green-600 to-yellow-400 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"
            />
          </div>
        </div>

        {/* Recommended Action & Explanation */}
        <div className="mb-6 bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-yellow-400 mb-2 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Recommended Action
          </div>
          <div className="inline-block px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono font-bold text-xs mb-2.5 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
            {recommendedAction}
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-mono">
            {explanation}
          </p>
        </div>

        {/* Policy Checks Evaluation List */}
        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-green-400 mb-3 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Policy Evaluation Checks
          </div>
          <div className="space-y-2">
            {policyChecks.map((check, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-mono bg-neutral-950/60 px-3 py-2 rounded-lg border border-neutral-800/40">
                <span className={check.passed ? 'text-neutral-200' : 'text-neutral-500 line-through'}>
                  {check.name}
                </span>
                {check.passed ? (
                  <span className="flex items-center gap-1 text-green-400 font-bold"><CheckCircle className="h-3.5 w-3.5" /> PASSED</span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400 font-bold"><XCircle className="h-3.5 w-3.5" /> FAILED</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </Card>
  );
}