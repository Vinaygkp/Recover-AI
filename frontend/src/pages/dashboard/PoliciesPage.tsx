import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policyService } from '../../services/policies';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { Shield, Sliders, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface PolicyData {
  max_retries?: number;
  recovery_window_days?: number;
  high_value_threshold?: number;
  max_discount_percentage?: number;
  manual_approval_threshold?: number;
  escalation_limit?: number;
  auto_retry_enabled?: boolean;
  reminder_enabled?: boolean;
  [key: string]: unknown;
}

export const PoliciesPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState<PolicyData>({});

  const { data, isLoading, isError, refetch } = useQuery({ 
    queryKey: ['policies'], 
    queryFn: () => policyService.get() 
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (newData: PolicyData) => policyService.update(newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast('success', 'Policies updated successfully', 'System guardrails and AI thresholds have been deployed.');
    },
    onError: (error: unknown) => {
      const errMessage = (error as { message?: string })?.message || 'Server rejected policy mutation.';
      toast('error', 'Failed to update policies', errMessage);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  const handleSave = () => {
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12">
        <Skeleton variant="metric" className="h-28" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} variant="card" className="h-40" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <Card variant="default" className="p-12 text-center border border-red-500/30">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4 animate-pulse" />
          <h3 className="text-base font-bold text-white font-mono mb-2">Failed to load recovery policies</h3>
          <p className="text-xs text-neutral-400 font-mono mb-6">Could not retrieve guardrail configurations from the server backend.</p>
          <Button onClick={() => refetch()} variant="secondary" className="text-xs font-mono cursor-pointer">
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 selection:bg-green-500/30">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0c0c0e] border border-neutral-800 p-7 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-green-400 font-bold">System Guardrails</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">Recovery Policies</h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-xl font-mono leading-relaxed">
            Configure automated retry limits, high-value thresholds, escalation rules, and AI decision guardrails.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-md hover:border-green-500/40"
            title="Reset form to saved state"
          >
            <RefreshCw className="w-3.5 h-3.5 text-neutral-400" /> Reset
          </button>
          
          <Button 
            type="button"
            onClick={handleSave} 
            disabled={mutation.isPending}
            variant="primary"
            className="text-xs font-mono uppercase tracking-wider bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-2.5 shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center gap-2 cursor-pointer"
          >
            {mutation.isPending ? (
              <>Saving changes...</>
            ) : (
              <><Check className="w-4 h-4" /> Save Policies</>
            )}
          </Button>
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Max Retries */}
        <Card variant="interactive" className="p-6 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <Sliders className="w-4 h-4 text-green-400" />
            <label htmlFor="max_retries" className="block text-xs font-mono uppercase tracking-wider text-white font-bold cursor-pointer">Maximum Retries</label>
          </div>
          <input 
            id="max_retries"
            type="number" 
            name="max_retries"
            value={formData.max_retries ?? 3} 
            onChange={handleChange}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-green-500 transition-all shadow-inner relative z-10"
          />
          <p className="text-[11px] text-neutral-400 font-mono mt-3 relative z-10 leading-relaxed">Maximum automated payment retry attempts per failed case.</p>
        </Card>

        {/* Recovery Window */}
        <Card variant="interactive" className="p-6 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <Sliders className="w-4 h-4 text-green-400" />
            <label htmlFor="recovery_window_days" className="block text-xs font-mono uppercase tracking-wider text-white font-bold cursor-pointer">Recovery Window (Days)</label>
          </div>
          <input 
            id="recovery_window_days"
            type="number" 
            name="recovery_window_days"
            value={formData.recovery_window_days ?? 7} 
            onChange={handleChange}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-green-500 transition-all shadow-inner relative z-10"
          />
          <p className="text-[11px] text-neutral-400 font-mono mt-3 relative z-10 leading-relaxed">Time limit before a failed payment case is marked as permanently closed.</p>
        </Card>

        {/* High Value Threshold */}
        <Card variant="interactive" className="p-6 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <Sliders className="w-4 h-4 text-green-400" />
            <label htmlFor="high_value_threshold" className="block text-xs font-mono uppercase tracking-wider text-white font-bold cursor-pointer">High Value Threshold (₹)</label>
          </div>
          <input 
            id="high_value_threshold"
            type="number" 
            name="high_value_threshold"
            value={formData.high_value_threshold ?? 10000} 
            onChange={handleChange}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-green-500 transition-all shadow-inner relative z-10"
          />
          <p className="text-[11px] text-neutral-400 font-mono mt-3 relative z-10 leading-relaxed">Transaction amount above which higher priority queue assignment is triggered.</p>
        </Card>

        {/* Max Discount */}
        <Card variant="interactive" className="p-6 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <Sliders className="w-4 h-4 text-green-400" />
            <label htmlFor="max_discount_percentage" className="block text-xs font-mono uppercase tracking-wider text-white font-bold cursor-pointer">Maximum Discount (%)</label>
          </div>
          <input 
            id="max_discount_percentage"
            type="number" 
            name="max_discount_percentage"
            value={formData.max_discount_percentage ?? 10} 
            onChange={handleChange}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-green-500 transition-all shadow-inner relative z-10"
          />
          <p className="text-[11px] text-neutral-400 font-mono mt-3 relative z-10 leading-relaxed">Maximum allowed recovery incentive discount percentage for customers.</p>
        </Card>

        {/* Manual Approval Threshold */}
        <Card variant="interactive" className="p-6 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <Sliders className="w-4 h-4 text-green-400" />
            <label htmlFor="manual_approval_threshold" className="block text-xs font-mono uppercase tracking-wider text-white font-bold cursor-pointer">Manual Approval (₹)</label>
          </div>
          <input 
            id="manual_approval_threshold"
            type="number" 
            name="manual_approval_threshold"
            value={formData.manual_approval_threshold ?? 25000} 
            onChange={handleChange}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-green-500 transition-all shadow-inner relative z-10"
          />
          <p className="text-[11px] text-neutral-400 font-mono mt-3 relative z-10 leading-relaxed">Any recovery action exceeding this capital amount requires manual admin approval.</p>
        </Card>

        {/* Escalation Limit */}
        <Card variant="interactive" className="p-6 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <Sliders className="w-4 h-4 text-green-400" />
            <label htmlFor="escalation_limit" className="block text-xs font-mono uppercase tracking-wider text-white font-bold cursor-pointer">Escalation Limit</label>
          </div>
          <input 
            id="escalation_limit"
            type="number" 
            name="escalation_limit"
            value={formData.escalation_limit ?? 5} 
            onChange={handleChange}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-green-500 transition-all shadow-inner relative z-10"
          />
          <p className="text-[11px] text-neutral-400 font-mono mt-3 relative z-10 leading-relaxed">Number of consecutive failures before escalating case directly to support.</p>
        </Card>
        
        {/* Auto Retry Toggle */}
        <Card variant="interactive" className="p-6 flex items-center justify-between relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="pr-4 relative z-10">
            <label htmlFor="auto_retry_enabled" className="block text-xs font-mono uppercase tracking-wider text-white font-bold mb-1 cursor-pointer">Auto Retry Enabled</label>
            <p className="text-[11px] text-neutral-400 font-mono leading-relaxed">Allow autonomous system to automatically re-trigger failed charges.</p>
          </div>
          <input 
            id="auto_retry_enabled"
            type="checkbox" 
            name="auto_retry_enabled"
            checked={Boolean(formData.auto_retry_enabled ?? true)}
            onChange={handleChange}
            className="w-5 h-5 accent-green-500 rounded cursor-pointer relative z-10 shrink-0"
          />
        </Card>

        {/* Smart Reminders Toggle */}
        <Card variant="interactive" className="p-6 flex items-center justify-between relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="pr-4 relative z-10">
            <label htmlFor="reminder_enabled" className="block text-xs font-mono uppercase tracking-wider text-white font-bold mb-1 cursor-pointer">Smart Reminders</label>
            <p className="text-[11px] text-neutral-400 font-mono leading-relaxed">Allow autonomous system to dispatch targeted SMS/Email reminders.</p>
          </div>
          <input 
            id="reminder_enabled"
            type="checkbox" 
            name="reminder_enabled"
            checked={Boolean(formData.reminder_enabled ?? true)}
            onChange={handleChange}
            className="w-5 h-5 accent-green-500 rounded cursor-pointer relative z-10 shrink-0"
          />
        </Card>

      </div>
    </div>
  );
};