import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Timeline, TimelineEvent } from '../../components/ui/Timeline';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { auditService } from '../../services/audit';
import { ScrollText, ShieldCheck, RefreshCw, Filter } from 'lucide-react';

export const AuditTrailPage = () => {
  const [filter, setFilter] = useState('All');
  
  const { data, isLoading, isError, refetch } = useQuery({ 
    queryKey: ['audit', filter], 
    queryFn: () => auditService.list({ event_type: filter !== 'All' ? filter.toLowerCase().replace(/\s+/g, '_') : undefined })
  });

  const rawItems: TimelineEvent[] = (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: TimelineEvent[] }).items))
    ? (data as { items: TimelineEvent[] }).items
    : (Array.isArray(data) ? data : []);

  const tabItems = [
    { id: 'All', label: 'All Events' },
    { id: 'System', label: 'System' },
    { id: 'AI Decision', label: 'AI Decisions' },
    { id: 'Manual Action', label: 'Manual Actions' }
  ];

  return (
    <div className="space-y-8 pb-12 selection:bg-green-500/30">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0c0c0e] border border-neutral-800 p-7 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <ScrollText className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-green-400 font-bold">Immutable Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">System Audit Trail</h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-xl font-mono leading-relaxed">
            Immutable chronological record of all system, AI diagnostics, security policies, and manual recovery actions.
          </p>
        </div>

        <button 
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-md hover:border-green-500/40 relative z-10"
        >
          <RefreshCw className="w-3.5 h-3.5 text-green-400 animate-spin" /> Refresh Logs
        </button>
      </div>

      {/* Tabs Filter Bar & Count */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="w-full sm:w-auto">
          <Tabs 
            tabs={tabItems}
            defaultTab={filter}
            onChange={setFilter}
          />
        </div>
        <div className="text-xs font-mono text-neutral-400 flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <Filter className="w-3.5 h-3.5 text-green-400" />
          <span>Total Log Entries: <strong className="text-white">{rawItems.length}</strong></span>
        </div>
      </div>

      {/* Audit Log Timeline Card Container */}
      <Card variant="default" className="p-7 relative overflow-hidden group border border-neutral-800 hover:border-green-500/40 transition-all">
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {isLoading ? (
          <div className="space-y-8 py-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 items-start">
                <Skeleton className="w-7 h-7 rounded-xl bg-neutral-900 shrink-0" />
                <div className="space-y-2.5 flex-1 bg-neutral-900/40 p-4 rounded-2xl border border-neutral-800/80">
                  <Skeleton className="h-4 w-1/4 bg-neutral-800" />
                  <Skeleton className="h-3 w-3/4 bg-neutral-800" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="text-xs font-mono text-red-400 mb-4">Failed to fetch audit trail logs from the server.</p>
            <button 
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : rawItems.length === 0 ? (
          <div className="py-8">
            <EmptyState 
              icon={ShieldCheck}
              title="No audit logs found" 
              description="There are currently no recorded audit trail events matching your selected filter criteria."
              actionLabel="Reset Filter"
              onAction={() => setFilter('All')}
            />
          </div>
        ) : (
          <Timeline events={rawItems} />
        )}
      </Card>
    </div>
  );
};