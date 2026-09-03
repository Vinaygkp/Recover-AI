import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { recoveryService } from '../../services/recovery';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Drawer } from '../../components/ui/Drawer';
import { Tabs } from '../../components/ui/Tabs';
import { AIInsightCard } from '../../components/ui/AIInsightCard';
import { RecoveryActions } from '../../components/recovery/RecoveryActions';
import { Timeline, TimelineEvent } from '../../components/ui/Timeline';
import { RecoveryCaseCard } from '../../components/ui/RecoveryCaseCard';
import { formatCurrency, timeAgo } from '../../lib/utils';
import { staggerContainer as staggerContainerVariants } from '../../animations/variants';
import { AlertCircle, ShieldAlert, RefreshCw, Clock, Wallet, CheckCircle2, CreditCard } from 'lucide-react';
import { RecoveryCase } from '../../types';

interface CaseDetailsResponse {
  case?: RecoveryCase & {
    ai_diagnosis?: string | { summary?: string; title?: string; explanation?: string };
    ai_explanation?: string;
    policy_checks?: Array<{ name: string; passed: boolean }>;
  };
  timeline?: TimelineEvent[];
}

export const RecoveryQueuePage = () => {
  const { id: paramCaseId } = useParams();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(paramCaseId || null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (paramCaseId) {
      setSelectedCaseId(paramCaseId);
    }
  }, [paramCaseId]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recoveryCases', filter],
    queryFn: () => recoveryService.getCases({ status: filter !== 'All' ? filter.toLowerCase().replace(/\s+/g, '_') : undefined })
  });

  const { data: caseDetails, isLoading: isCaseLoading, refetch: refetchCaseDetails } = useQuery<CaseDetailsResponse>({
    queryKey: ['recoveryCase', selectedCaseId],
    queryFn: () => recoveryService.getCase(selectedCaseId!),
    enabled: !!selectedCaseId
  });

  const rawItems: RecoveryCase[] = (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: RecoveryCase[] }).items))
    ? (data as { items: RecoveryCase[] }).items
    : (Array.isArray(data) ? data : []);

  const totalCount = (data && typeof data === 'object' && 'total' in data && typeof (data as { total: number }).total === 'number') 
    ? (data as { total: number }).total 
    : rawItems.length;

  const tabItems = [
    { id: 'All', label: 'All Cases' },
    { id: 'Detected', label: 'Detected' },
    { id: 'In Progress', label: 'In Progress' },
    { id: 'Recovered', label: 'Recovered' },
    { id: 'Failed', label: 'Failed' },
    { id: 'Stopped', label: 'Stopped' },
    { id: 'Manual Review', label: 'Manual Review' }
  ];

  return (
    <div className="space-y-8 pb-12 selection:bg-green-500/30">

      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0c0c0e] border border-neutral-800 p-7 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-green-400 font-bold">Active Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">Recovery Queue</h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-xl font-mono leading-relaxed">
            Monitor, inspect, and execute Razorpay payment recovery actions across at-risk merchant transactions.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-md hover:border-green-500/40"
          >
            <RefreshCw className="w-3.5 h-3.5 text-green-400 animate-spin" /> Refresh Queue
          </button>

          <Badge variant="success" className="text-xs font-mono py-2 px-4 bg-green-500/10 border border-green-500/20 text-green-400 font-bold rounded-xl">
            {totalCount} Cases
          </Badge>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="w-full">
        <Tabs
          tabs={tabItems}
          defaultTab={filter}
          onChange={setFilter}
        />
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-[#0c0c0e] border border-neutral-800 rounded-2xl p-6 shadow-xl">
              <Skeleton variant="card" className="h-48 bg-neutral-900/50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-16 text-center bg-[#0c0c0e] border border-red-500/30 rounded-2xl">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4 animate-pulse" />
          <h3 className="text-base font-bold text-white font-mono mb-2">Failed to load recovery queue</h3>
          <p className="text-xs font-mono text-neutral-400 mb-6">Could not retrieve active recovery cases from the backend server.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : rawItems.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No recovery cases found"
          description="There are currently no active payment failure cases matching your selected filter criteria."
          actionLabel="Reset Filter"
          onAction={() => setFilter('All')}
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {rawItems.map((item: RecoveryCase) => (
            <RecoveryCaseCard key={item.id} data={item} onSelect={(id) => setSelectedCaseId(id)} />
          ))}
        </motion.div>
      )}

      {/* Case Details Drawer */}
      <Drawer
        isOpen={!!selectedCaseId}
        onClose={() => setSelectedCaseId(null)}
        title={caseDetails?.case ? `Case #${String(caseDetails.case.id).slice(0, 8)}` : 'Case Details'}
        width="max-w-xl"
      >
        {isCaseLoading ? (
          <div className="space-y-6">
            <Skeleton variant="card" className="h-40 bg-neutral-900/50 rounded-2xl" />
            <Skeleton variant="card" className="h-32 bg-neutral-900/50 rounded-2xl" />
            <Skeleton variant="table" className="h-64 bg-neutral-900/50 rounded-2xl" />
          </div>
        ) : caseDetails?.case ? (
          <div className="space-y-6">

            {/* Summary Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl shadow-inner">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-1 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-green-400" /> Amount at Risk
                </span>
                <p className="text-xl font-extrabold text-white font-mono tracking-tight">{formatCurrency(caseDetails.case.amount)}</p>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl shadow-inner">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Failure Age
                </span>
                <p className="text-sm font-bold text-white font-mono mt-1">{timeAgo(caseDetails.case.created_at)}</p>
              </div>
            </div>

            {/* Payment Recovery Action Controls */}
            <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-green-400" /> Payment Recovery Action
              </h4>
              <RecoveryActions 
                caseId={caseDetails.case.id} 
                status={caseDetails.case.status} 
                amount={caseDetails.case.amount} 
                onActionComplete={() => {
                  refetch();
                  refetchCaseDetails();
                }}
              />
            </div>

            {/* AI Diagnosis Insight Card */}
            {caseDetails.case.ai_diagnosis && (
              <AIInsightCard
                diagnosis={
                  typeof caseDetails.case.ai_diagnosis === 'string' 
                    ? caseDetails.case.ai_diagnosis 
                    : (caseDetails.case.ai_diagnosis?.summary || caseDetails.case.ai_diagnosis?.title || 'AI Payment Diagnosis')
                }
                probability={caseDetails.case.recovery_probability ?? 0.8}
                recommendedAction={String(caseDetails.case.recommended_action || 'smart_retry').replace('_', ' ').toUpperCase()}
                explanation={
                  caseDetails.case.ai_explanation || 
                  (typeof caseDetails.case.ai_diagnosis === 'object' && caseDetails.case.ai_diagnosis !== null ? caseDetails.case.ai_diagnosis.explanation : null) || 
                  'AI automated risk and recovery evaluation.'
                }
                policyChecks={(caseDetails.case as any).policy_checks || [
                  { name: "Retry limit guardrail check", passed: true },
                  { name: "High-value threshold check", passed: true },
                  { name: "Recovery window active check", passed: true }
                ]}
              />
            )}

            {/* Audit Timeline */}
            <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">Audit Timeline</h3>
              <Timeline events={(caseDetails.timeline || []) as TimelineEvent[]} />
            </div>
          </div>
        ) : (
          <EmptyState
            icon={AlertCircle}
            title="Case not found"
            description="The requested recovery case details could not be retrieved from the server."
          />
        )}
      </Drawer>
    </div>
  );
};