import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Cpu, Activity, Zap } from 'lucide-react';

const loadingSteps = [
  "INITIALIZING REVENUE INTELLIGENCE",
  "SCANNING PAYMENT SIGNALS",
  "DETECTING REVENUE RISK",
  "LOADING RECOVERY ENGINE",
  "CHECKING STOPPING RULES",
  "RECOVERY ENGINE READY"
];

export function LoadingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const isLoaded = sessionStorage.getItem('recover_ai_loaded');
    if (isLoaded) {
      navigate('/home');
      return;
    }

    const totalDuration = 4000;
    const stepDuration = totalDuration / loadingSteps.length;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, stepDuration);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, totalDuration / 100);

    const timer = setTimeout(() => {
      sessionStorage.setItem('recover_ai_loaded', 'true');
      navigate('/home');
    }, totalDuration + 200);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center relative overflow-hidden selection:bg-green-500/30">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-lg px-6 z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10 relative"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-mono tracking-widest mb-4">
            <Zap className="w-3.5 h-3.5 animate-pulse" /> REVENUE RECOVERY ENGINE
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-[0.2em] uppercase mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-100 to-neutral-400">
            AI REVENUE RECOVERY
          </h1>
          <p className="text-amber-400/90 text-xs md:text-sm font-mono tracking-wide">
            Find revenue that's slipping away and win it back.
          </p>
        </motion.div>

        {/* Steps Card */}
        <div className="w-full bg-[#0c0c0f]/90 border border-neutral-800 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-4 mb-8">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-xs font-mono text-neutral-400">
            <span>STAGED INITIALIZATION</span>
            <span className="text-green-400 font-bold font-mono">{Math.floor(progress)}%</span>
          </div>

          <div className="space-y-3 py-2">
            {loadingSteps.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={
                  currentStep >= index
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0.3, x: -5 }
                }
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between text-xs font-mono tracking-wider"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${currentStep === index ? 'bg-green-400 animate-ping' : currentStep > index ? 'bg-green-500' : 'bg-neutral-800'}`} />
                  <span className={currentStep === index ? "text-white font-semibold" : currentStep > index ? "text-neutral-300" : "text-neutral-600"}>
                    {step}
                  </span>
                </div>
                {currentStep > index && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20"
                  >
                    READY
                  </motion.span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-neutral-900 relative overflow-hidden rounded-full mt-2 border border-neutral-800">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-400 shadow-[0_0_15px_rgba(34,197,94,0.6)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>

        {/* Footer Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-6 text-[11px] font-mono text-neutral-400 tracking-wider"
        >
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-400" /> BOUNDED ACTIONS</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-amber-400" /> STOPPING RULES</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-sky-400" /> AUDIT TRAIL</span>
        </motion.div>
      </div>

      {/* Bottom Workflow Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 text-[10px] tracking-[0.3em] text-neutral-500 font-mono font-semibold"
      >
        DETECT • DIAGNOSE • DECIDE • ACT • RECOVER • VERIFY • STOP • AUDIT
      </motion.div>
    </div>
  );
}