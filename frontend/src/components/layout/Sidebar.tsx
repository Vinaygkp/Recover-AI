import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { Database, Terminal } from 'lucide-react';
import { simulationService } from '../../services/simulation';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';

export function Sidebar() {
  const location = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateData = async () => {
    try {
      setIsGenerating(true);
      await simulationService.generateDemoData();
      toast('success', 'Demo data generated', 'Refresh to see the new data.');
    } catch (error) {
      console.error('Failed to generate demo data:', error);
      toast('error', 'Failed to generate data');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <aside className="w-64 border-r border-neutral-800 bg-[#070707] flex flex-col h-screen sticky top-0 hidden md:flex selection:bg-green-500/30 z-30 shadow-2xl">
      
      {/* Brand Header with Custom Logo */}
      <div className="h-20 flex items-center px-6 border-b border-neutral-800/80 bg-[#0a0a0a]/50 backdrop-blur-md">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-[#0f0f11] border border-neutral-700/80 shadow-[0_0_20px_rgba(56,189,248,0.15)] flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 to-transparent pointer-events-none" />
            <svg className="w-5 h-5 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L3 18H8.5L12 11.5L15.5 18H21L12 4Z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-sm font-extrabold tracking-wider text-white uppercase font-mono flex items-center gap-1.5">
            RECOVER <span className="text-amber-400">AI</span>
          </span>
        </div>
      </div>

      {/* Test Mode / Demo Pill */}
      <div className="p-4">
        <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
          <Terminal className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">
            TEST MODE / DEMO
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          const IconComponent = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-mono uppercase tracking-wider transition-all group relative overflow-hidden",
                isActive 
                  ? "text-white bg-green-500/10 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)] font-semibold" 
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-green-400 to-yellow-400 rounded-r-md shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              )}
              <IconComponent className={cn("h-4 w-4 transition-colors", isActive ? "text-green-400" : "text-neutral-500 group-hover:text-neutral-300")} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Demo Data Generator */}
      <div className="p-4 border-t border-neutral-800/80 bg-[#0a0a0a]/50 backdrop-blur-md">
        <Button 
          variant="secondary" 
          className="w-full text-xs font-mono tracking-wider gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white shadow-md hover:border-green-500/50 transition-all py-3 rounded-xl cursor-pointer"
          onClick={handleGenerateData}
          disabled={isGenerating}
        >
          <Database className={cn("h-3.5 w-3.5 text-green-400", isGenerating && "animate-spin")} />
          {isGenerating ? 'Generating...' : 'Generate Demo Data'}
        </Button>
      </div>
    </aside>
  );
}