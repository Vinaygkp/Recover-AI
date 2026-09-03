import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { transactionService } from '../../services/transactions';
import { DataTable } from '../../components/ui/DataTable';
import { StatusIndicator } from '../../components/ui/StatusIndicator';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tabs } from '../../components/ui/Tabs';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Copy, ArrowLeftRight, Search, RefreshCw, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

interface TransactionItem {
  id: string;
  amount: number;
  status: string;
  payment_method?: string;
  created_at: string;
  [key: string]: unknown;
}

export const TransactionsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const { data, isLoading, isError, refetch } = useQuery({ 
    queryKey: ['transactions', statusFilter], 
    queryFn: () => transactionService.getAll({ status: statusFilter !== 'All' ? statusFilter.toLowerCase() : undefined }) 
  });

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast('success', 'Copied to clipboard', `Transaction ID ${text} copied successfully.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const rawItems: TransactionItem[] = (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: TransactionItem[] }).items))
    ? (data as { items: TransactionItem[] }).items
    : (Array.isArray(data) ? data : []);

  const filteredItems = rawItems.filter((item: TransactionItem) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const idStr = String(item.id || '').toLowerCase();
    const methodStr = String(item.payment_method || '').toLowerCase();
    return idStr.includes(term) || methodStr.includes(term);
  });

  const tabItems = [
    { id: 'All', label: 'All Transactions' },
    { id: 'Success', label: 'Success' },
    { id: 'Failed', label: 'Failed' },
    { id: 'Pending', label: 'Pending' },
    { id: 'Abandoned', label: 'Abandoned' }
  ];

  const columns = [
    {
      header: 'Transaction ID',
      accessorKey: 'id' as keyof TransactionItem,
      cell: (item: TransactionItem) => (
        <div 
          onClick={() => navigate(`/dashboard/transactions/${item.id}`)}
          className="flex items-center gap-2.5 font-mono text-xs cursor-pointer"
        >
          <span className="text-white font-bold hover:text-green-400 transition-colors">#{String(item.id).substring(0, 10)}...</span>
          <button 
            type="button"
            onClick={(e) => handleCopy(e, item.id)} 
            className="p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Copy ID"
          >
            {copiedId === item.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          </button>
        </div>
      )
    },
    {
      header: 'Amount',
      accessorKey: 'amount' as keyof TransactionItem,
      cell: (item: TransactionItem) => <span className="font-mono font-bold text-white text-xs">{formatCurrency(item.amount)}</span>
    },
    {
      header: 'Status',
      accessorKey: 'status' as keyof TransactionItem,
      cell: (item: TransactionItem) => <StatusIndicator status={item.status} />
    },
    {
      header: 'Payment Method',
      accessorKey: 'payment_method' as keyof TransactionItem,
      cell: (item: TransactionItem) => <span className="font-mono text-xs text-neutral-300">{item.payment_method || 'Razorpay UPI / Card'}</span>
    },
    {
      header: 'Date',
      accessorKey: 'created_at' as keyof TransactionItem,
      cell: (item: TransactionItem) => <span className="font-mono text-xs text-neutral-400">{formatDate(item.created_at)}</span>
    },
    {
      header: 'Actions',
      accessorKey: 'id' as keyof TransactionItem,
      cell: (item: TransactionItem) => (
        <Button 
          type="button"
          variant="secondary" 
          size="sm" 
          onClick={() => navigate(`/dashboard/transactions/${item.id}`)}
          className="text-xs font-mono uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white shadow-md hover:border-green-500/40 py-1.5 px-3 cursor-pointer"
        >
          View Record
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-8 pb-12 selection:bg-green-500/30">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0c0c0e] border border-neutral-800 p-7 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <ArrowLeftRight className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-green-400 font-bold">Ledger Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">Payment Transactions</h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-xl font-mono leading-relaxed">
            View, search, and manage all payment gateway transactions, failure logs, and recovery attempts in real-time.
          </p>
        </div>

        <button 
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-md hover:border-green-500/40 relative z-10"
        >
          <RefreshCw className="w-3.5 h-3.5 text-green-400 animate-spin" /> Refresh Ledger
        </button>
      </div>

      {/* Tabs Filter Bar & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap bg-[#0c0c0e] border border-neutral-800 p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="w-full sm:w-auto">
          <Tabs 
            tabs={tabItems}
            defaultTab={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input 
            type="text"
            placeholder="Search ID or method..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-green-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Content Table Rendering */}
      {isLoading ? (
        <div className="bg-[#0c0c0e] border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <Skeleton variant="table" className="h-[400px] w-full bg-neutral-900/50 rounded-xl" />
        </div>
      ) : isError ? (
        <div className="p-16 text-center bg-[#0c0c0e] border border-red-500/30 rounded-2xl">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4 animate-pulse" />
          <h3 className="text-base font-bold text-white font-mono mb-2">Failed to load transactions ledger</h3>
          <p className="text-xs font-mono text-neutral-400 mb-6">Could not retrieve payment transactions from the backend server.</p>
          <button 
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState 
          icon={Sparkles}
          title="No transactions found" 
          description="There are currently no transaction records matching your selected filter or search query."
          actionLabel="Reset Filters"
          onAction={() => { setStatusFilter('All'); setSearchTerm(''); }}
        />
      ) : (
        <DataTable 
          data={filteredItems} 
          columns={columns}
          className="border-neutral-800 bg-[#0c0c0e] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
        />
      )}
    </div>
  );
};