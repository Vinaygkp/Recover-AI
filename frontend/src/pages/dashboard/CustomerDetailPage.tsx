import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User as UserIcon, Wallet, ShieldAlert, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Timeline, TimelineEvent } from '../../components/ui/Timeline';
import { DataTable } from '../../components/ui/DataTable';
import { StatusIndicator } from '../../components/ui/StatusIndicator';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

export const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: customer, isLoading, isError } = useQuery({ 
    queryKey: ['customer', id], 
    queryFn: () => api.get(`/customers/${id}`).then(res => res.data)
  });

  const { data: transactions, isLoading: isTxLoading } = useQuery({
    queryKey: ['customer_transactions', id],
    queryFn: () => api.get('/transactions', { params: { customer_id: id } }).then(res => res.data),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12">
        <Skeleton className="h-10 w-36 rounded-xl bg-neutral-900" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" className="h-[450px]" />
          <Skeleton variant="table" className="lg:col-span-2 h-[450px]" />
        </div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="space-y-6 pb-12">
        <Button variant="ghost" onClick={() => navigate('/dashboard/customers')} className="mb-4 text-xs font-mono cursor-pointer">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Button>
        <EmptyState 
          icon={UserIcon}
          title="Customer not found" 
          description="The requested customer profile could not be retrieved from the database."
          actionLabel="Return to Customers"
          onAction={() => navigate('/dashboard/customers')}
        />
      </div>
    );
  }

  const txItems = (transactions && typeof transactions === 'object' && 'items' in transactions && Array.isArray((transactions as { items: unknown[] }).items))
    ? (transactions as { items: unknown[] }).items
    : (Array.isArray(transactions) ? transactions : []);

  return (
    <div className="space-y-8 pb-12 selection:bg-green-500/30">
      
      {/* Back Navigation Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/customers')} 
          className="text-xs font-mono uppercase tracking-wider bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all shadow-md cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4 text-green-400" /> Back to Customers
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Customer Profile Sidebar Card */}
        <Card variant="default" className="p-7 lg:col-span-1 space-y-7 relative overflow-hidden group border border-neutral-800 hover:border-green-500/40 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <div className="absolute top-0 right-0 w-36 h-36 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 border-b border-neutral-800/80 pb-5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest font-bold">Verified Account</span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight font-mono">{customer.name || customer.email || 'Customer Profile'}</h2>
            <p className="font-mono text-xs text-neutral-400 mt-1">ID: #{customer.id}</p>
          </div>

          {/* Metrics breakdown */}
          <div className="space-y-4 relative z-10 font-mono text-xs">
            <div className="flex justify-between items-center py-2.5 border-b border-neutral-900">
              <span className="text-neutral-400 flex items-center gap-2"><Wallet className="w-3.5 h-3.5 text-neutral-500" /> Total Transactions</span>
              <span className="font-bold text-white bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-800">{customer.total_transactions || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-neutral-900">
              <span className="text-neutral-400 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Successful</span>
              <span className="font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">{customer.successful_transactions || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-neutral-900">
              <span className="text-neutral-400 flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400" /> Failed</span>
              <span className="font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">{customer.failed_transactions || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-neutral-900">
              <span className="text-neutral-400 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-green-400" /> Recovered Revenue</span>
              <span className="font-bold text-green-400">{formatCurrency(customer.recovered_amount || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-neutral-400 flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> At-Risk Amount</span>
              <span className="font-bold text-amber-400">{formatCurrency(customer.at_risk_amount || 0)}</span>
            </div>
          </div>

          {/* Recovery History Timeline */}
          {customer.recovery_history && customer.recovery_history.length > 0 && (
            <div className="mt-6 border-t border-neutral-800/80 pt-6 relative z-10">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4">Recovery History</h3>
              <Timeline events={customer.recovery_history as TimelineEvent[]} />
            </div>
          )}
        </Card>

        {/* Transaction History Data Table */}
        <Card variant="default" className="p-7 lg:col-span-2 relative overflow-hidden group border border-neutral-800 hover:border-green-500/40 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight font-mono">Transaction History</h3>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">Complete chronological ledger of customer billing events</p>
            </div>
            <span className="text-xs font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-xl">
              {txItems.length} Transactions
            </span>
          </div>

          <div className="relative z-10">
            {isTxLoading ? (
              <Skeleton variant="table" className="h-[320px] bg-neutral-900/50 rounded-xl" />
            ) : (
              <DataTable 
                data={txItems as Array<Record<string, unknown>>}
                columns={[
                  { header: 'Transaction ID', accessorKey: 'id', cell: (i: Record<string, unknown>) => <span className="font-mono text-xs text-neutral-300">#{String(i.id || '').substring(0,8)}</span> },
                  { header: 'Amount', accessorKey: 'amount', cell: (i: Record<string, unknown>) => <span className="font-mono font-bold text-white">{formatCurrency(Number(i.amount || 0))}</span> },
                  { header: 'Status', accessorKey: 'status', cell: (i: Record<string, unknown>) => <StatusIndicator status={String(i.status || '')} /> },
                  { header: 'Date', accessorKey: 'created_at', cell: (i: Record<string, unknown>) => <span className="text-xs font-mono text-neutral-400">{formatDate(String(i.created_at || ''))}</span> },
                ]}
                className="border-neutral-800 bg-neutral-900/40 rounded-xl"
              />
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};