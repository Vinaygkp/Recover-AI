import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpRight, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-neutral-800/80 bg-[#050507] pt-16 pb-10 text-neutral-400 relative overflow-hidden font-mono">
      
      {/* Background Ambient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[200px] bg-green-500/5 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Top Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <div 
              className="flex items-center gap-2.5 mb-3 group cursor-pointer" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-green-500 via-emerald-400 to-yellow-400 shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center justify-center p-[1px]">
                <div className="w-full h-full bg-[#0a0a0a] rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-green-400" />
                </div>
              </div>
              <span className="text-base font-extrabold tracking-widest text-white uppercase font-mono">
                RECOVER <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400">AI</span>
              </span>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed font-mono mb-2">
              Detect. Diagnose. Decide. Recover.
            </p>
            <p className="text-neutral-500 text-[11px] leading-relaxed font-mono">
              Autonomous AI revenue recovery engine.
            </p>
          </div>
          
          {/* Product Column */}
          <div>
            <h4 className="text-xs font-mono font-bold text-white mb-4 uppercase tracking-[0.2em]">Product</h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link to="/dashboard/recovery" className="hover:text-green-400 transition-colors flex items-center gap-1 group/link">
                  Recovery Engine <ArrowUpRight className="w-3 h-3 opacity-50 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform text-green-400" />
                </Link>
              </li>
              <li>
                <Link to="/dashboard/transactions" className="hover:text-green-400 transition-colors flex items-center gap-1 group/link">
                  Revenue at Risk <ArrowUpRight className="w-3 h-3 opacity-50 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform text-green-400" />
                </Link>
              </li>
              <li>
                <Link to="/dashboard/simulation" className="hover:text-green-400 transition-colors flex items-center gap-1 group/link">
                  Recovery Runs <ArrowUpRight className="w-3 h-3 opacity-50 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform text-green-400" />
                </Link>
              </li>
              <li>
                <Link to="/dashboard/analytics" className="hover:text-green-400 transition-colors flex items-center gap-1 group/link">
                  Analytics <ArrowUpRight className="w-3 h-3 opacity-50 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform text-green-400" />
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Platform Column */}
          <div>
            <h4 className="text-xs font-mono font-bold text-white mb-4 uppercase tracking-[0.2em]">Platform</h4>
            <ul className="space-y-2 text-xs font-mono">
              <li><Link to="/dashboard/ai-decisions" className="hover:text-green-400 transition-colors">AI Decisions</Link></li>
              <li><Link to="/dashboard/policies" className="hover:text-green-400 transition-colors">Guardrail Policies</Link></li>
              <li><Link to="/dashboard/audit" className="hover:text-green-400 transition-colors">Audit Trail</Link></li>
              <li><Link to="/dashboard/settings" className="hover:text-green-400 transition-colors">Settings</Link></li>
            </ul>
          </div>

          {/* Access Column */}
          <div>
            <h4 className="text-xs font-mono font-bold text-white mb-4 uppercase tracking-[0.2em]">Access</h4>
            <ul className="space-y-2 text-xs font-mono">
              <li><Link to="/dashboard" className="hover:text-green-400 transition-colors">Console Dashboard</Link></li>
              <li><Link to="/login" className="hover:text-green-400 transition-colors">Merchant Login</Link></li>
              <li><Link to="/register" className="hover:text-green-400 transition-colors">Create Account</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-neutral-800/80 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-4 text-neutral-400 text-[11px]">
            <span>&copy; {new Date().getFullYear()} RECOVER AI. All rights reserved.</span>
            <span>•</span>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
          
          <div className="px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            <p className="text-[11px] text-neutral-300 font-mono">
              AI Revenue Recovery Platform
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}