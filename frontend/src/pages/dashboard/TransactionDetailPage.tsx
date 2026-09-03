import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, Check, ShieldCheck, CreditCard, Hash, User, AlertTriangle, Server } from 'lucide-react';
import { transactionService } from '../../services/transactions';
import { Card } from '../../components/ui/Card';
import { StatusIndicator } from '../../components/ui/StatusIndicator';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { AIInsightCard } from '../../components/ui/AIInsightCard';
import { Timeline, TimelineEvent } from '../../components/ui/Timeline';
import { RecoveryActions } from '../../components/recovery/RecoveryActions';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export const TransactionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState(false);
  
  const { data, isLoading, isError } = useQuery({ 
    queryKey: ['transaction', id], 
    queryFn: () => transactionService.getById(id!),
    enabled: !!id
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast('success', 'Copied to clipboard', `Transaction ID ${text} copied successfully.`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12">
        <Skeleton className="h-10 w-40 rounded-xl bg-neutral-900" />
        <Skeleton variant="card" className="h-[500px] w-full bg-neutral-900/50 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6 pb-12">
        <Button variant="ghost" onClick={() => navigate('/dashboard/transactions')} className="mb-4 text-xs font-mono cursor-pointer">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Transactions
        </Button>
        <EmptyState 
          icon={AlertTriangle}
          title="Transaction not found" 
          description="The requested transaction record could not be retrieved from the ledger database."
          actionLabel="Return to Transactions"
          onAction={() => navigate('/dashboard/transactions')}
        />
      </div>
    );
  }

  const hasCase = !!data.recovery_case;
  const rawAiDiagnosis = data.recovery_case?.ai_diagnosis;
  const aiDiagnosisText = typeof rawAiDiagnosis === 'string' 
    ? rawAiDiagnosis 
    : (rawAiDiagnosis?.summary || rawAiDiagnosis?.title || 'AI Payment Diagnosis');
  
  const aiExplanationText = data.recovery_case?.ai_explanation || 
    (typeof rawAiDiagnosis === 'object' && rawAiDiagnosis !== null ? rawAiDiagnosis.explanation : null) || 
    'AI automated risk and recovery evaluation.';

  return (
    <div className="space-y-8 pb-12 selection:bg-green-500/30">
      
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          type="button"
          variant="ghost" 
          onClick={() => navigate('/dashboard/transactions')} 
          className="text-xs font-mono uppercase tracking-wider bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all shadow-md cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4 text-green-400" /> Back to Transactions
        </Button>
      </div>

      <Card variant="default" className="p-8 relative overflow-hidden group border border-neutral-800 hover:border-green-500/40 transition-all shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-neutral-800/80 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest font-bold">Ledger Record</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">{formatCurrency(data.amount)}</h1>
          </div>
          <div className="flex items-center gap-4">
            <StatusIndicator status={data.status} />
            <div className="text-right bg-neutral-900/80 border border-neutral-800 px-4 py-2.5 rounded-2xl shadow-inner">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Created At</p>
              <p className="font-mono text-xs text-white font-bold mt-0.5">{formatDate(data.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Gateway Info Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs relative z-10">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Gateway</span>
            <p className="font-bold text-blue-400 mt-0.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" /> {data.gateway || 'Razorpay'}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Mode</span>
            <p className="font-bold text-amber-400 mt-0.5 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-amber-400" /> {data.environment || 'TEST MODE'}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Signature Verification</span>
            <p className="font-bold text-green-400 mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> {data.verified ? 'SERVER VERIFIED' : 'HMAC SHA256'}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Payment ID</span>
            <p className="font-bold text-white mt-0.5 truncate">{data.razorpay_payment_id || 'pay_pending'}</p>
          </div>
        </div>

        {/* Two Column Details & Recovery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 relative z-10">
          
          {/* Left Column: Transaction Metadata */}
          <div className="space-y-5 bg-neutral-900/50 border border-neutral-800/80 p-6 rounded-2xl shadow-inner">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4 text-green-400" /> Transaction Metadata
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div className="pb-3 border-b border-neutral-800/80">
                <span className="text-neutral-400 block mb-1 uppercase tracking-wider text-[10px]">Transaction ID</span>
                <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <span className="text-white font-bold">{data.id}</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(data.id)} 
                    className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
                    title="Copy ID"
                  >
                    {copiedId ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="pb-3 border-b border-neutral-800/80">
                <span className="text-neutral-400 block mb-1 uppercase tracking-wider text-[10px]">Order ID</span>
                <p className="text-white font-bold bg-neutral-950 p-3 rounded-xl border border-neutral-800">{data.order_id || 'ord_demo_101'}</p>
              </div>

              <div className="pb-3 border-b border-neutral-800/80">
                <span className="text-neutral-400 block mb-1 uppercase tracking-wider text-[10px]">Customer ID</span>
                <p className="text-white font-bold bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-neutral-500" /> {data.customer_id}
                </p>
              </div>

              <div className="pb-3 border-b border-neutral-800/80">
                <span className="text-neutral-400 block mb-1 uppercase tracking-wider text-[10px]">Payment Method</span>
                <p className="text-white font-bold bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-green-400" /> {data.payment_method || 'Razorpay UPI / Card'}
                </p>
              </div>

              {data.failure_reason && (
                <div>
                  <span className="text-red-400 block mb-1 uppercase tracking-wider text-[10px]">Failure Diagnosis</span>
                  <p className="font-bold text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{data.failure_reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Recovery & Audit Timeline */}
          <div className="space-y-6">
            {hasCase && data.recovery_case ? (
              <div className="space-y-6">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Razorpay Payment Recovery</h3>
                
                <RecoveryActions 
                  caseId={data.recovery_case.id} 
                  status={data.recovery_case.status} 
                  amount={data.amount} 
                />

                {data.recovery_case.ai_diagnosis && (
                  <AIInsightCard 
                    diagnosis={aiDiagnosisText} 
                    probability={data.recovery_case.recovery_probability ?? 0.8}
                    recommendedAction={String(data.recovery_case.recommended_action || 'smart_retry')}
                    explanation={aiExplanationText}
                    policyChecks={data.recovery_case.policy_checks || []}
                  />
                )}
                {data.audit_timeline && (
                  <div className="bg-neutral-900/50 border border-neutral-800/80 p-6 rounded-2xl shadow-inner">
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">Audit Timeline</h4>
                    <Timeline events={(data.audit_timeline || []) as TimelineEvent[]} />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-2xl p-10 bg-neutral-900/30 text-center">
                <ShieldCheck className="w-10 h-10 text-green-400 mb-3 animate-pulse" />
                <p className="text-xs font-mono text-neutral-300 font-bold">Successful Transaction</p>
                <p className="text-xs font-mono text-neutral-400 mt-1">Payment verified & recorded in ledger. No recovery required.</p>
              </div>
            )}
          </div>

        </div>
      </Card>
    </div>
  );
};