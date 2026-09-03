import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ShieldCheck, Lock, Eye, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export function PrivacyPage() {
  return (
    <div className="w-full min-h-screen bg-[#07070a] text-white font-sans selection:bg-yellow-500/30">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-20 font-mono">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0c0c0f] border border-neutral-800 p-8 sm:p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-green-400">DATA PRIVACY & SECURITY</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">Privacy Policy</h1>
          <p className="text-neutral-400 text-xs mb-8">Last updated: September 2026</p>

          <div className="space-y-6 text-neutral-300 text-xs sm:text-sm leading-relaxed border-t border-neutral-800/80 pt-6">
            <section>
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-400" /> 1. Merchant Data Isolation & Encryption
              </h2>
              <p>
                RECOVER AI enforces strict tenant data isolation. All transaction telemetry, payment failure records, customer tokens, and audit logs are encrypted both in transit (TLS 1.3) and at rest (AES-256). Customer payment credentials are handled exclusively through secure gateway rails (Razorpay PCI-DSS Level 1 compliant infrastructure).
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" /> 2. AI Intelligence Security & Prompt Defense
              </h2>
              <p>
                All customer failure payloads passed to internal AI diagnostic engines are strictly enclosed in untrusted data wrappers (`&lt;untrusted_customer_payload&gt;`). AI reasoning models are constrained by deterministic policy guardrails to prevent instruction overrides or unauthorized data exposure.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" /> 3. Immutable Audit Trails
              </h2>
              <p>
                Every recovery action, probability calculation, and gateway retry event is permanently logged in the system audit trail. Audit logs record timestamps, case IDs, actors (AI, SYSTEM, HUMAN), and outcome metrics for full compliance transparency.
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
