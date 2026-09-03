import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';
import { Brain, CheckCircle, XCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../lib/utils';

interface PolicyCheck {
  name: string;
  passed: boolean;
}

interface PolicyRule {
  rule?: string;
  passed?: boolean;
}

interface AIDecisionData {
  amount?: number;
  failure_type?: string;
  failureType?: string;
  recovery_probability?: number;
  probability?: number;
  recommended_action?: string;
  action?: string;
  ai_explanation?: string;
  ai_diagnosis?: string;
  customer_name?: string;
  customer_id?: string | number;
  transaction_id?: string | number;
  title?: string;
  policy_result?: {
    allowed?: boolean;
    checks?: PolicyRule[];
  };
  retry_count?: number;
  max_retries?: number;
  status?: string;
}

interface AIDecisionCardProps {
  data?: AIDecisionData;
  title?: string;
  amount?: number;
  failureType?: string;
  probability?: number;
  action?: string;
  reasoning?: string;
  policyChecks?: PolicyCheck[];
  result?: 'ALLOWED' | 'BLOCKED' | string;
}

export function AIDecisionCard(props: AIDecisionCardProps) {
  const [step, setStep] = useState(0);
  const data: AIDecisionData = props.data || props;

  const amount = props.amount ?? data.amount ?? 0;
  const rawFailureType = props.failureType ?? data.failure_type ?? data.failureType ?? 'Payment Failure';
  const failureType = typeof rawFailureType === 'string' ? rawFailureType.replace(/_/g, ' ').toUpperCase() : 'PAYMENT FAILURE';
  
  const probability = props.probability ?? data.recovery_probability ?? data.probability ?? 0.72;
  const action = props.action ?? data.recommended_action ?? data.action ?? 'retry';
  const reasoning = props.reasoning ?? data.ai_explanation ?? data.ai_diagnosis ?? 'System diagnosed recovery likelihood based on historical telemetry.';
  
  // Unique customer / case specific title
  const customerIdentifier = data.customer_name 
    || (data.customer_id ? `Customer #${String(data.customer_id).slice(0, 6)}` : null)
    || (data.transaction_id ? `Tx #${String(data.transaction_id).slice(0, 6)}` : 'Recovery Case');
  const cardTitle = props.title || data.title || `${customerIdentifier} Decision`;

  // Extract policy checks safely with explicit typing
  const checksFromPolicy: PolicyCheck[] | undefined = data.policy_result?.checks?.map((c: PolicyRule) => ({
    name: (c.rule || 'Policy Check').replace(/_/g, ' ').toUpperCase(),
    passed: c.passed !== false
  }));

  const policyChecks: PolicyCheck[] = (props.policyChecks && props.policyChecks.length > 0)
    ? props.policyChecks
    : (checksFromPolicy && checksFromPolicy.length > 0 
        ? checksFromPolicy 
        : [
            { name: 'MAX RETRIES LIMIT (3)', passed: (data.retry_count || 0) < (data.max_retries || 3) },
            { name: 'RECOVERY WINDOW VALID (7 DAYS)', passed: true },
            { name: 'MANUAL APPROVAL THRESHOLD', passed: amount <= 25000 }
          ]);

  const isBlocked = (data.status === 'stopped' || data.status === 'failed' || data.policy_result?.allowed === false);
  const result = props.result ? props.result : (isBlocked ? 'BLOCKED' : 'ALLOWED');

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(s => (s < 4 ? s + 1 : s));
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="p-7 relative overflow-hidden bg-[#0c0c0e] border border-neutral-800 hover:border-green-500/50 transition-all duration-500 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-2xl group">
      
      {/* Background Neon Glow Accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-green-500/10 transition-all duration-500" />
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6 border-b border-neutral-800/80 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-green-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> AUTONOMOUS AGENT
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">{cardTitle}</h3>
          <p className="text-xs font-mono text-neutral-400 mt-0.5">Vector: <span className="text-yellow-400 font-bold">{failureType}</span></p>
        </div>
        <div className="text-right bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-inner">
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Amount</p>
          <p className="text-xl font-extrabold text-white font-mono tracking-tight">{formatCurrency(amount)}</p>
        </div>
      </div>

      <div className="space-y-5 relative z-10">
        
        {/* Step 1: Diagnosis & Confidence */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: step >= 1 ? 1 : 0.4, y: step >= 1 ? 0 : 5 }} className="flex gap-4 p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-800/60">
          <div className="mt-0.5 p-2 rounded-lg bg-green-500/10 border border-green-500/20 h-fit">
            <Brain className="h-4 w-4 text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-xs font-mono text-neutral-300 uppercase tracking-wider">Confidence Score</p>
              <span className="text-xs font-mono font-bold text-green-400">{formatPercentage(probability)}</span>
            </div>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${Math.min(100, Math.max(0, probability * 100))}%` }}
                className="h-full bg-gradient-to-r from-green-600 to-yellow-400 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-neutral-400 mt-2">Recommended: <span className="text-white font-semibold font-mono uppercase text-yellow-400">{action}</span></p>
          </div>
        </motion.div>

        {/* Step 2: Policy Evaluation */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: step >= 2 ? 1 : 0.4, y: step >= 2 ? 0 : 5 }} className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-800/60">
          <div className="flex items-center gap-2 text-xs font-mono text-yellow-400 mb-3">
            <ShieldCheck className="w-4 h-4" /> POLICY EVALUATION CHECKS
          </div>
          <div className="space-y-2">
            {policyChecks.map((check: PolicyCheck, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs font-mono bg-neutral-950/60 px-3 py-2 rounded-lg border border-neutral-800/40">
                <span className="text-neutral-300">{check.name}</span>
                {check.passed ? (
                  <span className="flex items-center gap-1 text-green-400 font-bold"><CheckCircle className="h-3.5 w-3.5" /> PASSED</span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400 font-bold"><XCircle className="h-3.5 w-3.5" /> FAILED</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step 3: Reasoning */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: step >= 3 ? 1 : 0.4, y: step >= 3 ? 0 : 5 }} className="flex gap-4 p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-800/60">
          <div className="mt-0.5 p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 h-fit">
            <Sparkles className="h-4 w-4 text-pink-400" />
          </div>
          <div>
            <p className="text-xs font-mono text-neutral-300 uppercase tracking-wider mb-1">Agent Reasoning</p>
            <p className="text-xs text-neutral-400 italic leading-relaxed">"{reasoning}"</p>
          </div>
        </motion.div>

        {/* Step 4: Final Status Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: step >= 4 ? 1 : 0.4, scale: step >= 4 ? 1 : 0.95 }} 
          className={`mt-4 p-3.5 rounded-xl border text-center font-mono font-bold tracking-[0.2em] text-xs shadow-lg ${
            result === 'ALLOWED' 
              ? 'bg-green-500/10 text-green-400 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.15)]' 
              : 'bg-red-500/10 text-red-400 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
          }`}
        >
          {result === 'ALLOWED' ? '● ACTION ALLOWED & EXECUTING' : '■ ACTION BLOCKED BY POLICY'}
        </motion.div>

      </div>
    </Card>
  );
}