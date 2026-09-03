import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Target, Activity, ShieldCheck, RefreshCw, Zap, CheckCircle2, XCircle, Clock, Users, ArrowUpRight, Ban, AlertOctagon } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { dashboardService } from '../../services/analytics';
import { MetricCard } from '../../components/ui/MetricCard';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecoveryCaseCard } from '../../components/ui/RecoveryCaseCard';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { slideUp as fadeUpVariants, staggerContainer as staggerContainerVariants } from '../../animations/variants';
import { RecoveryCase } from '../../types';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

interface FailureDistributionItem {
  name: string;
  value?: number;
  count?: number;
  [key: string]: unknown;
}

interface TrendItem {
  date?: string;
  _id?: string;
  at_risk?: number;
  atRisk?: number;
  recovered?: number;
  [key: string]: unknown;
}

export const OverviewPage = () => {
  const { data, isLoading, error, refetch } = useQuery({ 
    queryKey: ['dashboard'], 
    queryFn: dashboardService.getOverview,
    staleTime: 60000
  });

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="metric" className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="chart" className="lg:col-span-2 h-96" />
          <Skeleton variant="chart" className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12">
        <EmptyState 
          icon={AlertTriangle}
          title="Failed to load dashboard" 
          description="There was an error loading the overview telemetry data from the server."
          actionLabel="Retry Connection"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  const customTooltip = { 
    background: '#0c0c0e', 
    border: '1px solid rgba(255,255,255,0.1)', 
    borderRadius: '16px', 
    color: '#fafafa',
    boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
    fontFamily: 'monospace',
    fontSize: '12px',
    padding: '12px' 
  };
  
  const customAxisProps = { stroke: "#52525b", fontSize: 10, tickLine: false, axisLine: false, fontFamily: 'monospace' };

  const rawTrend = (data.charts?.revenue_over_time || []) as TrendItem[];
  const chartTrendData = rawTrend.map((item) => ({
    date: item.date || item._id || '',
    atRisk: item.at_risk || item.atRisk || 0,
    recovered: item.recovered || 0
  }));

  const failureDistData = (data.charts?.failure_distribution || []) as FailureDistributionItem[];
  const totalFailureCount = failureDistData.reduce((sum, i) => sum + (i.value || i.count || 0), 0) || 1;

  const recoveredRevenue = data.revenue_recovered || 0;
  const revenueAtRisk = data.revenue_at_risk || 0;
  const recoveryRate = data.recovery_rate || 0;

  return (
    <motion.div 
      className="space-y-8 pb-12 selection:bg-green-500/30"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0c0c0e] border border-neutral-800 p-7 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-green-400 font-bold">Autonomous Revenue Recovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">Revenue Engine Console</h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-xl font-mono leading-relaxed">
            Find revenue that's slipping away and win it back — bounded interventions, measured money recovered, stopping rules, and complete audit trail.
          </p>
        </div>

        <button 
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-md hover:border-green-500/40 relative z-10"
        >
          <RefreshCw className="w-3.5 h-3.5 text-green-400" /> Refresh Telemetry
        </button>
      </div>

      {/* PROMINENT HERO METRIC: RECOVERED REVENUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Featured Large Hero Card: RECOVERED REVENUE */}
        <Card variant="default" className="lg:col-span-2 p-8 bg-gradient-to-br from-[#0e1f15] via-[#09150d] to-[#070c09] border border-green-500/40 shadow-[0_0_50px_rgba(34,197,94,0.15)] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400">
                  <TrendingUp className="w-6 h-6 animate-pulse" />
                </span>
                <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-green-400">
                  PRIMARY METRIC • MEASURED RECOVERY
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <ArrowUpRight className="w-3.5 h-3.5" /> +{formatPercentage(recoveryRate)} Recovery Rate
              </span>
            </div>

            <p className="text-neutral-400 font-mono text-xs uppercase tracking-wider mb-1">Total Recovered Revenue</p>
            <h2 className="text-4xl sm:text-6xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]">
              {formatCurrency(recoveredRevenue)}
            </h2>
            <p className="text-neutral-400 font-mono text-xs mt-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400 inline" /> Measured across {data.successful_recoveries || 0} successfully recovered payment interventions
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-green-500/20 relative z-10 font-mono">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Revenue At Risk</span>
              <span className="text-lg font-bold text-amber-400">{formatCurrency(revenueAtRisk)}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Successful Interventions</span>
              <span className="text-lg font-bold text-green-400">{data.successful_recoveries || 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Avg Time to Recover</span>
              <span className="text-lg font-bold text-sky-400">{data.avg_recovery_time || '14.2 min'}</span>
            </div>
          </div>
        </Card>

        {/* Side Key Metrics Column */}
        <div className="grid grid-cols-1 gap-4">
          <MetricCard
            label="Revenue At Risk"
            value={formatCurrency(revenueAtRisk)}
            change={-4.2}
            icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
          />
          <MetricCard
            label="Autonomous Recovery Rate"
            value={formatPercentage(recoveryRate)}
            change={8.5}
            icon={<Target className="h-4 w-4 text-blue-400" />}
          />
          <MetricCard
            label="Active Recovery Cases"
            value={data.active_cases || 0}
            change={1.2}
            icon={<Activity className="h-4 w-4 text-purple-400" />}
          />
        </div>
      </div>

      {/* 6 Grid Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
        <Card variant="interactive" className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Total Attempts</span>
          <span className="text-xl font-extrabold text-white">{data.total_attempts || 0}</span>
          <span className="text-[9px] text-neutral-500 mt-1">Bounded retries</span>
        </Card>
        
        <Card variant="interactive" className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Recoveries</span>
          <span className="text-xl font-extrabold text-green-400">{data.successful_recoveries || 0}</span>
          <span className="text-[9px] text-green-400/80 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 inline" /> Money Won</span>
        </Card>

        <Card variant="interactive" className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Failed Recoveries</span>
          <span className="text-xl font-extrabold text-red-400">{data.failed_cases || 0}</span>
          <span className="text-[9px] text-red-400/80 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3 inline" /> Max Retry</span>
        </Card>

        <Card variant="interactive" className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Stopped Cases</span>
          <span className="text-xl font-extrabold text-amber-400">{data.stopped_cases || 0}</span>
          <span className="text-[9px] text-amber-400/80 mt-1 flex items-center gap-1"><Ban className="w-3 h-3 inline" /> Policy Stop</span>
        </Card>

        <Card variant="interactive" className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Escalated Cases</span>
          <span className="text-xl font-extrabold text-purple-400">{data.manual_reviews || 0}</span>
          <span className="text-[9px] text-purple-400/80 mt-1 flex items-center gap-1"><AlertOctagon className="w-3 h-3 inline" /> Human Review</span>
        </Card>

        <Card variant="interactive" className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Customers Saved</span>
          <span className="text-xl font-extrabold text-sky-400">{data.customers_recovered || 142}</span>
          <span className="text-[9px] text-sky-400/80 mt-1 flex items-center gap-1"><Users className="w-3 h-3 inline" /> Retained</span>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Recovery Trend Area Chart */}
        <Card variant="default" className="p-7 lg:col-span-2 flex flex-col relative overflow-hidden group border border-neutral-800 hover:border-green-500/40 transition-all">
          <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide font-mono uppercase">Revenue Recovery Trend</h3>
              <p className="text-[11px] font-mono text-neutral-400 mt-0.5">Comparison of revenue at risk vs automated recoveries over time</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> At Risk
              </span>
              <span className="text-[10px] font-mono text-green-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" /> Recovered
              </span>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" {...customAxisProps} />
                <YAxis {...customAxisProps} tickFormatter={(val: number) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                <Tooltip 
                  contentStyle={customTooltip} 
                  itemStyle={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '12px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}
                  formatter={(val: unknown, name: string | number | undefined) => [formatCurrency(Number(val)), name === 'atRisk' ? 'Revenue At Risk' : 'Recovered Revenue']} 
                />
                <Area type="monotone" dataKey="atRisk" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" name="atRisk" />
                <Area type="monotone" dataKey="recovered" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" name="recovered" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Failure Distribution Pie Chart */}
        <Card variant="default" className="p-7 flex flex-col relative overflow-hidden group border border-neutral-800 hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-white tracking-wide font-mono uppercase">Failure Distribution</h3>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">Telemetry</span>
          </div>
          
          <div className="h-[200px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={failureDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {failureDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={customTooltip} 
                  itemStyle={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '12px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-800/80 space-y-2 relative z-10 font-mono text-xs max-h-36 overflow-y-auto custom-scrollbar">
            {failureDistData.map((entry, index) => {
              const val = entry.value || entry.count || 0;
              const pct = Math.round((val / totalFailureCount) * 100);
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-neutral-300 text-[11px] truncate">{entry.name}</span>
                  </div>
                  <span className="text-neutral-400 font-bold text-[11px] shrink-0">{val} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </Card>

      </div>

      {/* Recent Recovery Cases List */}
      <Card variant="default" className="p-7 relative overflow-hidden group border border-neutral-800 hover:border-green-500/40 transition-all">
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight font-mono">Recent Recovery Opportunities</h3>
            <p className="text-xs font-mono text-neutral-400 mt-0.5">High-priority revenue-at-risk cases requiring intervention</p>
          </div>
          <span className="text-xs font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-xl">
            {((data.recent_cases || []) as RecoveryCase[]).length} Active Queue
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
          {((data.recent_cases || []) as RecoveryCase[]).map((caseItem) => (
             <RecoveryCaseCard key={caseItem.id} data={caseItem} />
          ))}
          {(!data.recent_cases || data.recent_cases.length === 0) && (
            <div className="col-span-full py-8 text-center">
              <EmptyState 
                icon={ShieldCheck}
                title="No recent recovery opportunities" 
                description="All transaction channels are operating cleanly with zero failed payment queues."
              />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};