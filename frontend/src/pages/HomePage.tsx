import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Card } from '../components/ui/Card';
import { AIEventStream } from '../components/ai/AIEventStream';
import { AIDecisionCard } from '../components/ai/AIDecisionCard';
import { Sparkles, ArrowRight, Zap, CreditCard, ShieldCheck, Activity, RefreshCw, Layers, CheckCircle2, Award, Clock, Star, Smartphone, TrendingUp, ChevronRight } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

export function HomePage() {
  const navigate = useNavigate();
  const [heroEmail, setHeroEmail] = useState('');

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroEmail.trim()) {
      navigate(`/register?email=${encodeURIComponent(heroEmail.trim())}`);
    } else {
      navigate('/register');
    }
  };

  const exampleDirections = [
    { title: 'Payment Degradation → Root Cause → Recovery Action', desc: 'Isolate gateway failures & execute optimal retry routing automatically.', icon: Zap, tag: 'Degradation' },
    { title: 'Checkout Drop-off Recovery', desc: 'Engage abandoned cart checkouts with instant bounded payment links.', icon: Activity, tag: 'Checkout' },
    { title: 'Failed-Subscription Recovery', desc: 'Retry recurring card & mandate mandates with dynamic schedule sequencing.', icon: RefreshCw, tag: 'Subscriptions' },
    { title: 'B2B Receivables Chaser', desc: 'Automate overdue invoice follow-ups with intelligent risk scoring.', icon: Layers, tag: 'B2B Payments' },
    { title: 'Mandate Retry Sequencer', desc: 'Execute NACH & e-Mandate retries aligned with customer salary cycles.', icon: Clock, tag: 'Mandates' },
    { title: 'Hinglish Voice & Messaging Recovery', desc: 'Multi-lingual customer outreach via AI SMS, WhatsApp & voice prompts.', icon: Sparkles, tag: 'Voice Outreach' },
    { title: 'Promise-to-Pay Tracker', desc: 'Track customer payment commitments with automated SLA monitoring.', icon: ShieldCheck, tag: 'P2P Tracking' },
  ];

  const steps = [
    { num: '01', title: 'DETECT', desc: 'Find money slipping away across multi-vector payment channels.', color: 'text-yellow-400', border: 'hover:border-yellow-500/60 hover:bg-yellow-500/[0.04]' },
    { num: '02', title: 'DIAGNOSE', desc: 'Isolate root cause payment friction & gateway failure reasons.', color: 'text-amber-400', border: 'hover:border-amber-500/60 hover:bg-amber-500/[0.04]' },
    { num: '03', title: 'DECIDE', desc: 'AI agent predicts probability score & selects optimal action.', color: 'text-yellow-300', border: 'hover:border-yellow-500/60 hover:bg-yellow-500/[0.04]' },
    { num: '04', title: 'GUARD', desc: 'Enforce strict max-retry limits & safety policy guardrails.', color: 'text-amber-300', border: 'hover:border-amber-500/60 hover:bg-amber-500/[0.04]' },
    { num: '05', title: 'RECOVER', desc: 'Execute secure retry, alternate link, or reminder workflows.', color: 'text-yellow-400', border: 'hover:border-yellow-500/60 hover:bg-yellow-500/[0.04]' },
    { num: '06', title: 'VERIFY', desc: 'Validate real-time settlement & merchant ledger reconciliation.', color: 'text-amber-400', border: 'hover:border-amber-500/60 hover:bg-amber-500/[0.04]' },
    { num: '07', title: 'AUDIT', desc: 'Immutable audit trail records every decision & money flow.', color: 'text-yellow-300', border: 'hover:border-yellow-500/60 hover:bg-yellow-500/[0.04]' },
  ];

  const risks = [
    { label: 'Failed Payments', amount: 320000, percentage: 38, borderHover: 'hover:border-amber-500/70 hover:bg-amber-500/[0.05] hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]', textAccent: 'text-amber-400' },
    { label: 'Checkout Abandonment', amount: 210000, percentage: 25, borderHover: 'hover:border-yellow-500/70 hover:bg-yellow-500/[0.05] hover:shadow-[0_0_25px_rgba(234,179,8,0.15)]', textAccent: 'text-yellow-400' },
    { label: 'Subscription Failures', amount: 180000, percentage: 21, borderHover: 'hover:border-amber-400/70 hover:bg-amber-400/[0.05] hover:shadow-[0_0_25px_rgba(251,191,36,0.15)]', textAccent: 'text-amber-300' },
    { label: 'Overdue Receivables', amount: 130000, percentage: 16, borderHover: 'hover:border-yellow-300/70 hover:bg-yellow-300/[0.05] hover:shadow-[0_0_25px_rgba(253,224,71,0.15)]', textAccent: 'text-yellow-200' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#07070a] text-white selection:bg-yellow-500/30 relative overflow-x-hidden font-sans">
      
      {/* Golden & Blue Gradient Background Glows (Matching Reference Graphic) */}
      <div className="absolute top-0 right-[-100px] w-[800px] h-[700px] bg-gradient-to-br from-amber-500/20 via-purple-600/10 to-blue-600/20 blur-[190px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] left-[-200px] w-[700px] h-[600px] bg-gradient-to-tr from-yellow-500/15 via-amber-500/10 to-transparent blur-[200px] rounded-full pointer-events-none" />

      <Navbar />

      <main className="relative z-10 w-full">
        
        {/* HERO SECTION MATCHING REFERENCE UI */}
        <section className="relative pt-20 pb-12 md:pt-24 md:pb-20 px-6 sm:px-10 lg:px-16 w-full max-w-[1550px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
            
            {/* Hero Left Column (Span 7) */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="lg:col-span-7 z-10"
            >
              {/* Quick Overview Pill Button */}
              <motion.button
                variants={fadeUpVariant}
                type="button"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-yellow-400 text-xs font-mono font-medium hover:border-yellow-500/50 transition-all cursor-pointer shadow-md mb-5 group"
              >
                <span>Get a quick overview</span>
                <div className="w-5 h-5 rounded-full bg-neutral-800 group-hover:bg-yellow-400 group-hover:text-black flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </motion.button>
              
              {/* Hero Main Bold Headline */}
              <motion.h1 
                variants={fadeUpVariant} 
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.08] mb-4 text-white font-mono"
              >
                Find revenue at risk. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-yellow-400">
                  Recover it before it’s gone.
                </span>
              </motion.h1>
              
              {/* Hero Subtitle */}
              <motion.p 
                variants={fadeUpVariant} 
                className="text-base sm:text-lg text-neutral-300 max-w-xl mb-6 leading-relaxed font-mono font-normal"
              >
                From failed payments to abandoned checkouts and overdue invoices, RECOVER AI turns revenue risk into measurable recovery.
              </motion.p>
              
              {/* Embedded Email Sign-up Input Bar (Matching Reference) */}
              <motion.form 
                variants={fadeUpVariant} 
                onSubmit={handleHeroSubmit}
                className="w-full max-w-lg mb-6 flex flex-col sm:flex-row items-center gap-3 bg-neutral-900/90 border border-neutral-800 p-2 sm:p-2.5 rounded-2xl sm:rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl group focus-within:border-yellow-400/60 transition-all"
              >
                <input 
                  type="email" 
                  value={heroEmail}
                  onChange={(e) => setHeroEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-transparent px-5 py-3 sm:py-2 text-xs sm:text-sm font-mono text-white placeholder-neutral-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto shrink-0 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold font-sans text-xs sm:text-sm px-7 py-3.5 sm:py-3 rounded-xl sm:rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] transition-all cursor-pointer whitespace-nowrap uppercase tracking-wider"
                >
                  Sign up for Recover AI
                </button>
              </motion.form>

              {/* Social Proof Stars & Hand Drawn Arrow */}
              <motion.div variants={fadeUpVariant} className="flex items-center gap-3 text-xs sm:text-sm font-mono text-neutral-300">
                <div className="flex items-center text-yellow-400">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  <Star className="w-4 h-4 fill-yellow-400" />
                  <Star className="w-4 h-4 fill-yellow-400" />
                  <Star className="w-4 h-4 fill-yellow-400" />
                  <Star className="w-4 h-4 fill-yellow-400" />
                </div>
                <span>Happy merchants with 37000+ Recoveries</span>
              </motion.div>
            </motion.div>

            {/* Hero Right Column: Smartphone / Terminal Mockup (Matching Reference Image) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="lg:col-span-5 relative flex flex-col items-center justify-center"
            >
              {/* Outer Glow */}
              <div className="absolute w-[360px] h-[520px] bg-gradient-to-tr from-yellow-500/20 via-amber-500/10 to-blue-600/30 blur-[90px] rounded-full pointer-events-none" />

              {/* Phone Frame Mockup Container */}
              <div className="relative w-[300px] sm:w-[330px] h-[580px] bg-[#0d0d12] border-[4px] border-neutral-700/80 hover:border-yellow-400/90 rounded-[48px] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.95)] hover:shadow-[0_0_50px_rgba(250,204,21,0.35)] transition-all duration-500 flex flex-col justify-between overflow-hidden backdrop-blur-2xl group cursor-pointer">
                
                {/* Top Notch & Status */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 mb-4 px-2">
                    <span>9:41</span>
                    <div className="w-16 h-3.5 bg-neutral-900 rounded-full border border-neutral-800" />
                    <span>5G</span>
                  </div>

                  {/* Header Card inside Phone */}
                  <div className="bg-neutral-900/90 border border-neutral-800/80 p-3.5 rounded-2xl mb-4">
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-neutral-400">RECOVERY REVENUE (INR)</span>
                      <span className="text-[10px] bg-amber-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">ETH</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-white">₹2,992 <span className="text-xs text-red-400 font-normal">-₹1,855</span></div>
                  </div>

                  {/* Graph Line Vector SVG */}
                  <div className="w-full h-36 relative my-2 px-1">
                    <div className="absolute right-2 top-2 text-[9px] font-mono text-neutral-500 border border-neutral-800 px-2 py-0.5 rounded">Line ∨</div>
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100" fill="none">
                      <path 
                        d="M0 60 Q 30 20, 60 70 T 120 30 T 180 80 T 200 10" 
                        stroke="#fbbf24" 
                        strokeWidth="2.5" 
                        fill="none" 
                      />
                    </svg>
                  </div>

                  {/* Time Range Selector */}
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500 px-2 py-2">
                    <span>1H</span>
                    <span className="text-yellow-400 font-bold border-b border-yellow-400">1D</span>
                    <span>1W</span>
                    <span>1M</span>
                    <span>1Y</span>
                    <span>All</span>
                  </div>
                </div>

                {/* Big Yellow Action Button (Recover / Trade) */}
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold font-sans py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(250,204,21,0.5)] transition-all cursor-pointer"
                  >
                    Recover Revenue
                  </button>

                  <div className="text-center text-[10px] font-mono text-neutral-500">
                    Activity &nbsp; About &nbsp; Videos
                  </div>

                  {/* Bottom App Navigation Icons */}
                  <div className="flex justify-around items-center border-t border-neutral-800/80 pt-3 text-[9px] font-mono text-neutral-500">
                    <div className="flex flex-col items-center gap-1 text-yellow-400">
                      <Smartphone className="w-4 h-4" />
                      <span>Home</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      <span>Wallet</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center -mt-4 shadow-lg">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Activity className="w-4 h-4" />
                      <span>Trade</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Profile</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Download / Console Button below Phone (Matching Reference) */}
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="mt-6 border border-white/40 hover:border-yellow-400 bg-neutral-900/80 text-white hover:text-yellow-300 px-6 py-2.5 rounded-full font-mono text-xs flex items-center gap-2 backdrop-blur-md shadow-lg transition-all cursor-pointer"
              >
                <span>Console Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-yellow-400" />
              </button>

            </motion.div>

          </div>

          {/* BOTTOM METRICS BAR (Matching Reference Image: 54+M / 630M / $427B) */}
          <div className="mt-20 pt-10 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
            <div>
              <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-1">Verified Recoveries</p>
              <p className="text-4xl sm:text-5xl font-extrabold font-mono text-yellow-400 tracking-tight">54M+</p>
            </div>
            <div>
              <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-1">Protected Revenue (INR)</p>
              <p className="text-4xl sm:text-5xl font-extrabold font-mono text-yellow-400 tracking-tight">₹630M</p>
            </div>
            <div>
              <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-1">Quarterly Volume Processed</p>
              <p className="text-4xl sm:text-5xl font-extrabold font-mono text-yellow-400 tracking-tight">$427B</p>
            </div>
          </div>

        </section>

        {/* AI Event Stream Component */}
        <section className="py-6 px-6 sm:px-10 lg:px-16 w-full max-w-[1550px] mx-auto">
          <Card variant="default" className="bg-[#09090b] border-amber-500/40 hover:border-amber-400 transition-all duration-300 border-l-amber-400 border-l-4 p-1 overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.8)]">
            <AIEventStream />
          </Card>
        </section>

        {/* WHY NOW Section */}
        <section id="features" className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 bg-[#040405] border-y border-neutral-800/80 w-full">
          <div className="max-w-[1550px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-mono tracking-widest mb-4">
                <Zap className="w-4 h-4" /> REVENUE FRICTION INSIGHT
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
                Why AI Revenue <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
                  Recovery Now?
                </span>
              </h2>
              <p className="text-neutral-400 font-mono text-xs sm:text-sm leading-relaxed">
                Traditional recovery relies on rigid hardcoded retries or manual outreach. RECOVER AI bridges real-time risk scoring with bounded gateway automation.
              </p>
            </div>

            <div className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-[#0a0a0e] border border-yellow-500/30 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
              <p className="text-base sm:text-lg text-neutral-200 leading-relaxed font-normal">
                "Revenue loss rarely happens in one clean step. A payment degrades, a checkout gets abandoned, a subscription fails, or an invoice goes overdue. AI can now close the loop from detecting the problem to diagnosing it, choosing the right intervention, and recovering the money."
              </p>
              <div className="mt-6 pt-5 border-t border-neutral-800 flex items-center justify-between font-mono text-xs text-yellow-400">
                <span>Autonomous Diagnostics & Guardrails</span>
                <span>Razorpay Test Mode Ready ✓</span>
              </div>
            </div>

          </div>
        </section>

        {/* EXAMPLE DIRECTIONS Section */}
        <section id="use-cases" className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 w-full max-w-[1550px] mx-auto">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              Example Recovery <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">Directions</span>
            </h2>
            <p className="text-neutral-400 font-mono text-xs sm:text-sm">Proven agentic workflows designed to recover revenue across payment channels.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {exampleDirections.map((dir, idx) => {
              const Icon = dir.icon;
              return (
                <motion.div
                  key={dir.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-6 sm:p-7 rounded-2xl bg-[#0b0b0e] border border-neutral-800 hover:border-yellow-500/50 hover:bg-yellow-500/[0.03] transition-all duration-300 group shadow-lg flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {dir.tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold font-mono text-white mb-2 group-hover:text-yellow-300 transition-colors leading-snug">{dir.title}</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-mono">{dir.desc}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono text-neutral-500 group-hover:text-yellow-400 transition-colors">
                    <span>Autonomous Workflow</span>
                    <span>&rarr;</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* THE BAR Section */}
        <section className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 bg-[#040405] border-y border-neutral-800/80 w-full">
          <div className="max-w-[1550px] mx-auto">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-mono tracking-widest mb-4">
                <Award className="w-4 h-4 text-yellow-400" /> THE RECOVER AI STANDARD
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                The Bar for Production AI Revenue Recovery
              </h2>
              <p className="text-sm sm:text-base text-neutral-300 font-mono leading-relaxed bg-[#0b0b0e] p-6 rounded-2xl border border-neutral-800 shadow-xl">
                "Don’t just identify the problem. Show measured money recovered across a batch, with compliant escalation, stopping rules, and an audit trail."
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Measured Recovered Money', desc: 'All recovered amounts are calculated directly from verified database settlement records.', icon: CheckCircle2, accent: 'text-green-400 border-green-500/30 bg-green-500/10' },
                { title: 'Compliant Escalation', desc: 'Transactions ≥ ₹10,000 trigger mandatory Merchant Manager approval guardrails.', icon: ShieldCheck, accent: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
                { title: 'Deterministic Stopping Rules', desc: 'Recovery halts automatically at max 3 retries to prevent customer fatigue or abuse.', icon: Clock, accent: 'text-red-400 border-red-500/30 bg-red-500/10' },
                { title: 'Immutable Audit Trail', desc: 'Every AI score, policy check, and gateway action is logged in an auditable ledger.', icon: Layers, accent: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
              ].map((bar, idx) => {
                const Icon = bar.icon;
                return (
                  <motion.div
                    key={bar.title}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.06 }}
                    className="p-6 rounded-2xl bg-[#0a0a0d] border border-neutral-800 hover:border-yellow-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className={cn("p-3 rounded-xl border w-fit mb-4", bar.accent)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-mono font-bold text-white mb-2">{bar.title}</h3>
                      <p className="text-xs font-mono text-neutral-400 leading-relaxed">{bar.desc}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-neutral-800/80 text-[10px] font-mono text-neutral-500">
                      VERIFIED ENFORCED
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 w-full max-w-[1550px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center md:text-left"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              How Recovery <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">Works</span>
            </h2>
            <p className="text-neutral-400 font-mono text-xs sm:text-sm">Seven automated steps from failure detection to settlement.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04 }}
                className={cn(
                  "p-6 sm:p-7 rounded-2xl bg-[#0b0b0e] border border-neutral-800 transition-all duration-300 group shadow-lg cursor-pointer",
                  step.border
                )}
              >
                <div className={cn("text-2xl font-mono transition-colors mb-3 font-bold", step.color)}>{step.num}</div>
                <h3 className="text-base font-semibold mb-2 group-hover:text-white transition-colors">{step.title}</h3>
                <p className="text-xs font-mono text-neutral-400 leading-relaxed group-hover:text-neutral-200 transition-colors">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Revenue At Risk Breakdown */}
        <section className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 bg-[#040405] border-y border-neutral-800/80 w-full">
          <div className="max-w-[1550px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2">Revenue At Risk</h2>
                <p className="text-neutral-400 font-mono text-xs sm:text-sm">Real-time intelligent detection across multi-vector payments.</p>
              </div>
              <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">₹8.42L</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {risks.map((risk, idx) => (
                <motion.div
                  key={risk.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  className={cn(
                    "p-6 sm:p-7 rounded-2xl bg-[#0b0b0e] border border-neutral-800 flex flex-col gap-3 transition-all duration-300 shadow-xl group cursor-pointer",
                    risk.borderHover
                  )}
                >
                  <div className={cn("text-xs font-semibold tracking-wide font-mono", risk.textAccent)}>{risk.label}</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-white">{formatCurrency(risk.amount)}</div>
                  <div className="text-xs font-mono text-neutral-400 group-hover:text-neutral-200 transition-colors mt-auto pt-4 border-t border-neutral-800">{risk.percentage}% of portfolio risk</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Decision Engine Section */}
        <section id="engine" className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 w-full max-w-[1550px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-mono tracking-widest mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                <Zap className="w-4 h-4 text-yellow-400" /> AGENTIC DECISION ENGINE
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
              >
                AI Decision Engine
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-sm sm:text-base text-neutral-300 mb-8 leading-relaxed font-normal"
              >
                Every recovery action is thoroughly reasoned, scored by probability, and verified against safety boundaries before execution.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.12 }}
              >
                <button 
                  type="button"
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:brightness-110 text-black font-extrabold px-8 py-4 rounded-2xl font-mono text-xs sm:text-sm uppercase tracking-widest shadow-[0_0_25px_rgba(250,204,21,0.4)] transition-all cursor-pointer flex items-center gap-2"
                >
                  Create Account <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full max-w-lg mx-auto"
            >
              <AIDecisionCard 
                amount={12500}
                failureType="Card Expired"
                probability={0.94}
                action="Smart Retry"
                reasoning="Historical pattern indicates high success rate on retry after card token update."
                policyChecks={[
                  { name: 'Max Retries Limit', passed: true },
                  { name: 'Amount Threshold', passed: true },
                  { name: 'Recovery Window', passed: true }
                ]}
                result="ALLOWED"
              />
            </motion.div>
          </div>
        </section>

        {/* Guardrails Section */}
        <section className="py-20 md:py-28 px-6 sm:px-10 lg:px-16 bg-[#040405] border-t border-neutral-800/80 w-full">
          <div className="max-w-[1550px] mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                AI can build & act.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">AI cannot cross safety limits.</span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto font-mono">
                Strict boundaries protect financial transactions while automation maximizes recovery.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'MAX RETRIES', val: '3', color: 'hover:border-yellow-500/70 hover:shadow-[0_0_20px_rgba(250,204,21,0.15)] text-yellow-400' },
                { label: 'MAX DISCOUNT', val: '10%', color: 'hover:border-yellow-500/70 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)] text-yellow-400' },
                { label: 'RECOVERY WINDOW', val: '7 DAYS', color: 'hover:border-amber-400/70 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] text-amber-300' },
                { label: 'HIGH VALUE REVIEW', val: '₹10,000+', color: 'hover:border-yellow-300/70 hover:shadow-[0_0_20px_rgba(253,224,71,0.15)] text-yellow-200' }
              ].map((guard, idx) => (
                <motion.div 
                  key={guard.label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  className="bg-[#0a0a0d] border border-neutral-800 transition-all duration-300 p-7 rounded-2xl text-center group shadow-xl cursor-pointer"
                >
                  <div className="text-xs font-mono text-neutral-400 mb-2 tracking-widest">{guard.label}</div>
                  <div className="text-2xl font-mono font-bold text-white tracking-wide">{guard.val}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}