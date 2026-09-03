import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promiseService, PromiseToPay } from '../../services/promises';
import { recoveryService } from '../../services/recovery';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../lib/utils';
import { CalendarCheck, CheckCircle2, AlertOctagon, RefreshCw, CheckSquare, AlertTriangle, ShieldCheck, DollarSign, Plus } from 'lucide-react';
import { RecoveryCase } from '../../types';

export const PromisesPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('all');
  
  // Create Promise Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCaseId, setNewCaseId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newInvoiceId, setNewInvoiceId] = useState('');
  const [newAmount, setNewAmount] = useState('85000');
  const [newPromisedDate, setNewPromisedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [newNotes, setNewNotes] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['promises', filter],
    queryFn: () => promiseService.list({ status: filter !== 'all' ? filter : undefined })
  });

  const { data: casesData } = useQuery({
    queryKey: ['recoveryCases', 'promises_select'],
    queryFn: () => recoveryService.getCases({ limit: 50 })
  });

  const availableCases: RecoveryCase[] = (casesData && typeof casesData === 'object' && 'items' in casesData && Array.isArray((casesData as { items: RecoveryCase[] }).items))
    ? (casesData as { items: RecoveryCase[] }).items
    : [];

  const rawItems: PromiseToPay[] = (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: PromiseToPay[] }).items))
    ? (data as { items: PromiseToPay[] }).items
    : (Array.isArray(data) ? data : []);

  const createPromiseMutation = useMutation({
    mutationFn: (payload: { case_id: string; amount: number; promised_date: string; customer_name?: string; invoice_id?: string; notes?: string }) => 
      promiseService.create(payload),
    onSuccess: (res) => {
      toast('success', 'Promise-to-Pay Created!', `Payment commitment created for ${res.customer_name || 'Customer'}.`);
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create promise record.';
      toast('error', 'Action failed', msg);
    }
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (id: string) => promiseService.recordPayment(id),
    onSuccess: (res) => {
      toast('success', 'Promise Fulfilled & Verified!', `₹${res.amount_recovered?.toLocaleString() || '0'} added to Verified Recovered Revenue.`);
      queryClient.invalidateQueries();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to record payment.';
      toast('error', 'Action failed', msg);
    }
  });

  const markMissedMutation = useMutation({
    mutationFn: (id: string) => promiseService.markMissed(id),
    onSuccess: () => {
      toast('warning', 'Promise Marked Missed', 'Auto-escalated to Account Manager & case flagged for review.');
      queryClient.invalidateQueries();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to mark missed.';
      toast('error', 'Action failed', msg);
    }
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string) => promiseService.escalate(id),
    onSuccess: () => {
      toast('warning', 'Promise Escalated', 'Escalated to Account Manager for executive manual review.');
      queryClient.invalidateQueries();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to escalate promise.';
      toast('error', 'Action failed', msg);
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const caseIdToUse = newCaseId || (availableCases.length > 0 ? availableCases[0].id : 'case_b2b_demo');
    createPromiseMutation.mutate({
      case_id: caseIdToUse,
      customer_name: newCustomerName || 'Enterprise B2B Client',
      invoice_id: newInvoiceId || 'INV-1042',
      amount: parseFloat(newAmount) || 85000.0,
      promised_date: new Date(newPromisedDate).toISOString(),
      notes: newNotes || 'Client committed to payment settlement upon invoice verification.'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" className="font-mono text-xs"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> PAID (VERIFIED)</Badge>;
      case 'missed':
        return <Badge variant="error" className="font-mono text-xs"><AlertOctagon className="w-3 h-3 mr-1 inline" /> MISSED</Badge>;
      case 'escalated':
        return <Badge variant="warning" className="font-mono text-xs"><AlertTriangle className="w-3 h-3 mr-1 inline" /> ESCALATED</Badge>;
      default:
        return <Badge variant="info" className="font-mono text-xs"><CheckSquare className="w-3 h-3 mr-1 inline" /> PROMISED</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12 selection:bg-green-500/30">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0c0c0e] border border-neutral-800 p-7 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <CalendarCheck className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-green-400 font-bold">B2B Receivables Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">Promise-to-Pay Tracker</h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-xl font-mono leading-relaxed">
            Track customer payment commitments. Verified payments add directly to recovered revenue; missed promises trigger bounded manager escalation.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black text-xs font-extrabold font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          >
            <Plus className="w-4 h-4" /> Create Promise
          </button>
          <button 
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-md hover:border-green-500/40"
          >
            <RefreshCw className="w-3.5 h-3.5 text-green-400" /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
        {['all', 'promised', 'paid', 'missed', 'escalated'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-4 py-2 rounded-xl border transition-all uppercase tracking-wider cursor-pointer ${
              filter === st 
                ? 'bg-green-500/10 border-green-500/50 text-green-400 font-bold shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Grid of Promise Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="card" className="h-56 bg-neutral-900/50 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 bg-[#0c0c0e] border border-red-500/30 rounded-2xl text-center font-mono">
          <p className="text-xs text-red-400 mb-4">Failed to fetch Promise-to-Pay records.</p>
          <button onClick={() => refetch()} className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs cursor-pointer">
            Retry Connection
          </button>
        </div>
      ) : rawItems.length === 0 ? (
        <EmptyState 
          icon={CheckSquare}
          title="No Promise-to-Pay records"
          description="There are currently no active customer payment commitments matching the selected status filter."
          actionLabel="Create Promise to Pay"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rawItems.map((item) => (
            <Card key={item.id} variant="interactive" className="p-6 relative overflow-hidden group border border-neutral-800 hover:border-green-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">{item.invoice_id || 'INVOICE'}</span>
                  {getStatusBadge(item.status)}
                </div>

                <h3 className="text-base font-bold font-mono text-white mb-1 truncate">{item.customer_name || 'Enterprise Customer'}</h3>
                <p className="text-2xl font-black font-mono text-white mb-4">{formatCurrency(item.amount)}</p>

                <div className="space-y-2 text-xs font-mono text-neutral-400 pt-3 border-t border-neutral-800/80">
                  <div className="flex justify-between">
                    <span>Promised Date:</span>
                    <span className="text-white font-semibold">{formatDate(item.promised_date)}</span>
                  </div>
                  {item.notes && (
                    <div className="text-[11px] text-neutral-400 italic bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800 mt-2">
                      "{item.notes}"
                    </div>
                  )}
                  {item.escalation_status && item.escalation_status !== 'none' && (
                    <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-bold bg-purple-500/10 border border-purple-500/20 p-2 rounded-xl">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{item.escalation_status.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-5 border-t border-neutral-800/80 flex flex-wrap items-center gap-2">
                {item.status === 'promised' || item.status === 'due' || item.status === 'missed' ? (
                  <>
                    <Button 
                      variant="primary"
                      disabled={recordPaymentMutation.isPending}
                      onClick={() => recordPaymentMutation.mutate(item.id)}
                      className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold font-mono text-xs py-2 rounded-xl cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5 mr-1 inline" /> Record Payment
                    </Button>
                    
                    {item.status !== 'missed' && (
                      <Button 
                        variant="secondary"
                        disabled={markMissedMutation.isPending}
                        onClick={() => markMissedMutation.mutate(item.id)}
                        className="bg-neutral-900 border-neutral-800 text-red-400 hover:border-red-500/40 text-xs font-mono py-2 rounded-xl cursor-pointer"
                      >
                        Mark Missed
                      </Button>
                    )}

                    <Button 
                      variant="secondary"
                      disabled={escalateMutation.isPending}
                      onClick={() => escalateMutation.mutate(item.id)}
                      className="bg-neutral-900 border-neutral-800 text-yellow-400 hover:border-yellow-500/40 text-xs font-mono py-2 rounded-xl cursor-pointer"
                    >
                      Escalate
                    </Button>
                  </>
                ) : (
                  <div className="w-full text-center text-xs font-mono text-neutral-500 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-green-400" /> Payment Processed & Audited
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Promise Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Promise-to-Pay Record"
        description="Record a customer's formal commitment to settle an overdue invoice."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 font-mono text-xs mt-2">
          <div>
            <label className="block text-neutral-400 mb-1">Customer / Enterprise Name</label>
            <input 
              type="text" 
              value={newCustomerName} 
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="e.g. Acme Tech Solutions Pvt Ltd"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Invoice ID</label>
              <input 
                type="text" 
                value={newInvoiceId} 
                onChange={(e) => setNewInvoiceId(e.target.value)}
                placeholder="e.g. INV-1042"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Amount (₹)</label>
              <input 
                type="number" 
                value={newAmount} 
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="85000"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Promised Date</label>
            <input 
              type="date" 
              value={newPromisedDate} 
              onChange={(e) => setNewPromisedDate(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Select Recovery Case (Optional)</label>
            <select
              value={newCaseId}
              onChange={(e) => setNewCaseId(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-green-500"
            >
              <option value="">Auto-associate case</option>
              {availableCases.map((c) => (
                <option key={c.id} value={c.id}>Case #{c.id.slice(0, 8)} — ₹{c.amount?.toLocaleString()} ({c.failure_type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Settlement Notes</label>
            <textarea 
              rows={3}
              value={newNotes} 
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Client agreed to initiate wire transfer on promised date following invoice audit."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              isLoading={createPromiseMutation.isPending}
              className="bg-green-500 hover:bg-green-400 text-black font-bold font-mono text-xs py-2.5 px-5 rounded-xl cursor-pointer"
            >
              Create Promise
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
