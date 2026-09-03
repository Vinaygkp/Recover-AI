import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ShieldCheck, Scale, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function TermsPage() {
  return (
    <div className="w-full min-h-screen bg-[#07070a] text-white font-sans selection:bg-yellow-500/30">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-20 font-mono">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0c0c0f] border border-neutral-800 p-8 sm:p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Scale className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">PLATFORM GOVERNANCE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">Terms of Service</h1>
          <p className="text-neutral-400 text-xs mb-8">Last updated: September 2026</p>

          <div className="space-y-6 text-neutral-300 text-xs sm:text-sm leading-relaxed border-t border-neutral-800/80 pt-6">
            <section>
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> 1. Bounded Recovery Interventions
              </h2>
              <p>
                RECOVER AI executes automated recovery actions (smart retries, payment link reminders, and manual review escalations) strictly within merchant-defined policy guardrails (maximum 3 retry attempts, 10% maximum discount limit, and mandatory manager approval for transactions exceeding ₹10,000).
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> 2. Measured Settlement Accounting
              </h2>
              <p>
                Recovered revenue figures displayed across the console represent actual verified settlements derived from underlying payment gateway telemetry. The platform does not alter gateway authorization states or simulate unverified financial balances.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" /> 3. Compliant Merchant Communications
              </h2>
              <p>
                All automated recovery communications (SMS, email, WhatsApp, payment links) adhere to strict compliance standards. Deceptive messaging, harassment, or fake urgency are prohibited across all recovery workflows.
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
