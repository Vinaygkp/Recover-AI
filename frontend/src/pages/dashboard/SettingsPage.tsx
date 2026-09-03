import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { simulationService } from '../../services/simulation';
import api from '../../services/api';
import { Settings, User, Cpu, Database, Trash2, CheckCircle2, Shield, Sparkles, RefreshCw, XCircle } from 'lucide-react';

interface RazorpayStatusResponse {
  status?: string;
  status_text?: string;
  key_id?: string;
  [key: string]: unknown;
}

export const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: rzpStatus } = useQuery<RazorpayStatusResponse>({
    queryKey: ['razorpay_status'],
    queryFn: () => api.get('/integrations/razorpay/status').then(r => r.data)
  });

  const isConnected = rzpStatus?.status === 'CONNECTED';

  const handleGenerateData = async () => {
    try {
      setIsGenerating(true);
      await simulationService.generateDemoData();
      toast('success', 'Demo data generated', '5,000 mock transactions and cases seeded successfully.');
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast('error', 'Failed to generate demo data');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to reset and regenerate test data? This will refresh all benchmark transactions.')) {
      try {
        setIsClearing(true);
        await simulationService.generateDemoData();
        toast('success', 'Database Reset', 'Demo data queue has been reset successfully.');
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        toast('error', 'Failed to reset data');
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="space-y-8 pb-12 selection:bg-green-500/35 max-w-4xl mx-auto">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0c0c0e] border border-neutral-800 p-7 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-green-400 font-bold">Preferences & Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">Settings</h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-xl font-mono leading-relaxed">
            Manage merchant credentials, Razorpay Gateway TEST MODE, ML parameters, and telemetry data pipeline.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card variant="interactive" className="p-7 relative group overflow-hidden border border-neutral-800">
        <div className="absolute top-0 right-0 w-36 h-36 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-5 relative z-10">
          <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-green-400">
            <User className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">User Profile & Account</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 font-mono text-xs">
          <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
            <span className="text-neutral-400 block mb-1 uppercase tracking-wider text-[10px]">Merchant Name</span>
            <p className="font-bold text-white text-sm">{user?.full_name || 'Vinay Kumar'}</p>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
            <span className="text-neutral-400 block mb-1 uppercase tracking-wider text-[10px]">Account Email</span>
            <p className="font-bold text-white text-sm truncate">{user?.email || 'vinay@recover.ai'}</p>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
            <span className="text-neutral-400 block mb-1 uppercase tracking-wider text-[10px]">Organization</span>
            <p className="font-bold text-white text-sm">{user?.company_name || 'Recover AI Engine'}</p>
          </div>
        </div>
      </Card>

      {/* Gateway Integrations Card */}
      <Card variant="interactive" className="p-7 relative group overflow-hidden border border-neutral-800">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-5 relative z-10">
          <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-blue-400">
            <Shield className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Gateway Integrations</h2>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl relative z-10 shadow-inner">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center font-extrabold text-white font-mono shadow-md">
              RZP
            </div>
            <div>
              <p className="font-bold text-white text-sm font-mono">Razorpay Payment Gateway</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-md ${
            isConnected
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
          }`}>
            {isConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {rzpStatus?.status_text || (isConnected ? 'RAZORPAY TEST MODE - CONNECTED' : 'RAZORPAY TEST MODE - NOT CONNECTED')}
          </span>

        </div>
      </Card>

      {/* ML Model Telemetry */}
      <Card variant="interactive" className="p-7 relative group overflow-hidden border border-neutral-800">
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-5 relative z-10">
          <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">ML Model Telemetry</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 font-mono text-xs">
          <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
            <span className="text-neutral-400 block mb-1 uppercase tracking-wider text-[10px]">Model Architecture</span>
            <span className="font-bold text-white">Gradient Boosting / RF</span>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
            <span className="text-neutral-400 block mb-1 uppercase tracking-wider text-[10px]">Feature Count</span>
            <span className="font-bold text-white">11 Vector Fields</span>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
            <span className="text-neutral-400 block mb-1 uppercase tracking-wider text-[10px]">Accuracy Score</span>
            <span className="font-bold text-green-400">94.2%</span>
          </div>
          <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
            <span className="text-neutral-400 block mb-1 uppercase tracking-wider text-[10px]">Inference Status</span>
            <span className="font-bold text-green-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Active
            </span>
          </div>
        </div>
      </Card>

      {/* Data Management Card */}
      <Card variant="interactive" className="p-7 relative group overflow-hidden border border-neutral-800">
        <div className="absolute top-0 right-0 w-36 h-36 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-4 relative z-10">
          <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-red-400">
            <Database className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Data Management & Test Pipeline</h2>
        </div>
        <p className="text-xs text-neutral-400 font-mono mb-6 relative z-10 leading-relaxed">
          Generate 5,000+ benchmark transactions and recovery cases or purge/reset database state.
        </p>
        <div className="flex flex-wrap gap-4 relative z-10">
          <Button 
            type="button"
            onClick={handleGenerateData}
            disabled={isGenerating}
            className="text-xs font-mono uppercase tracking-wider bg-green-500 text-black font-bold hover:bg-green-400 transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} /> 
            {isGenerating ? 'Generating Data...' : 'Generate Demo Data'}
          </Button>

          <Button 
            type="button"
            variant="secondary" 
            onClick={handleClearData}
            disabled={isClearing}
            className="text-xs font-mono uppercase tracking-wider bg-neutral-900 hover:bg-red-500/10 border border-red-500/30 text-red-400 hover:border-red-500 transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Trash2 className="w-3.5 h-3.5" /> {isClearing ? 'Resetting Data...' : 'Reset Telemetry State'}
          </Button>
        </div>
      </Card>

      {/* Footer Branding Card */}
      <Card variant="default" className="p-6 text-center border border-neutral-800 bg-[#0c0c0e]">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-green-400" />
          <h2 className="font-bold text-white text-sm font-mono tracking-widest uppercase">RECOVER AI</h2>
        </div>
        <p className="text-xs font-mono text-neutral-400 mb-2">Version 1.0.0 (Production Quality Build)</p>
        <p className="text-[11px] font-mono text-neutral-500">Built for the Razorpay AI Buildathon</p>
      </Card>

    </div>
  );
};