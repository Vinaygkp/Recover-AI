import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency } from '../../lib/utils';
import { customerService } from '../../services/customers';
import { Users, ShieldCheck, RefreshCw, Search } from 'lucide-react';

interface CustomerItem {
  id: string;
  email?: string;
  name?: string;
  total_transactions?: number;
  successful_transactions?: number;
  failed_transactions?: number;
  at_risk_amount?: number;
  recovered_amount?: number;
  [key: string]: unknown;
}

export const CustomersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, isLoading, isError, refetch } = useQuery({ 
    queryKey: ['customers'], 
    queryFn: () => customerService.list()
  });

  const rawItems: CustomerItem[] = (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: CustomerItem[] }).items))
    ? (data as { items: CustomerItem[] }).items
    : (Array.isArray(data) ? data : []);

  const filteredItems = rawItems.filter((item: CustomerItem) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const idStr = String(item.id || '').toLowerCase();
    const emailStr = String(item.email || '').toLowerCase();
    const nameStr = String(item.name || '').toLowerCase();
    return idStr.includes(term) || emailStr.includes(term) || nameStr.includes(term);
  });

  const columns = [
    {
      header: 'Customer ID',
      accessorKey: 'id' as keyof CustomerItem,
      cell: (item: CustomerItem) => (
        <span 
          onClick={() => navigate(`/dashboard/customers/${item.id}`)}
          className="font-mono text-xs text-white font-bold cursor-pointer hover:text-green-400 transition-colors"
        >
          #{String(item.id).substring(0, 10)}
        </span>
      )
    },
    {
      header: 'Total Transactions',
      accessorKey: 'total_transactions' as keyof CustomerItem,
      cell: (item: CustomerItem) => <span className="font-mono text-neutral-300">{item.total_transactions || 0}</span>
    },
    {
      header: 'Successful',
      accessorKey: 'successful_transactions' as keyof CustomerItem,
      cell: (item: CustomerItem) => <span className="font-mono font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20">{item.successful_transactions || 0}</span>
    },
    {
      header: 'Failed',
      accessorKey: 'failed_transactions' as keyof CustomerItem,
      cell: (item: CustomerItem) => <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">{item.failed_transactions || 0}</span>
    },
    {
      header: 'At-Risk Amount',
      accessorKey: 'at_risk_amount' as keyof CustomerItem,
      cell: (item: CustomerItem) => <span className="font-mono font-bold text-amber-400">{formatCurrency(item.at_risk_amount || 0)}</span>
    },
    {
      header: 'Recovered Amount',
      accessorKey: 'recovered_amount' as keyof CustomerItem,
      cell: (item: CustomerItem) => <span className="font-mono font-bold text-green-400">{formatCurrency(item.recovered_amount || 0)}</span>
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
              <Users className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-green-400 font-bold">Client Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">Customers</h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-xl font-mono leading-relaxed">
            Inspect customer billing profiles, transaction history, at-risk capital, and automated recovery performance.
          </p>
        </div>

        <button 
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-md hover:border-green-500/40 relative z-10"
        >
          <RefreshCw className="w-3.5 h-3.5 text-green-400 animate-spin" /> Refresh Directory
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0c0c0e] border border-neutral-800 p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input 
            type="text"
            placeholder="Search customer by ID or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-green-500 transition-all shadow-inner"
          />
        </div>
        <div className="text-xs font-mono text-neutral-400 px-4 py-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
          Showing <strong className="text-white">{filteredItems.length}</strong> customers
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="bg-[#0c0c0e] border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <Skeleton variant="table" className="h-[400px] w-full bg-neutral-900/50 rounded-xl" />
        </div>
      ) : isError ? (
        <div className="p-16 text-center bg-[#0c0c0e] border border-red-500/30 rounded-2xl">
          <p className="text-xs font-mono text-red-400 mb-4">Failed to fetch customer directory from server.</p>
          <button 
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState 
          icon={ShieldCheck}
          title="No customers found" 
          description="There are currently no customer records matching your search or filter criteria in the database."
          actionLabel="Clear Search"
          onAction={() => setSearchTerm('')}
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