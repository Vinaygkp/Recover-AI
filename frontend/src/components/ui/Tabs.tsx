import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Sparkles } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  content?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    if (onChange) onChange(id);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Tabs Header Bar */}
      <div className="flex space-x-2 border-b border-neutral-800 relative overflow-x-auto no-scrollbar bg-[#0c0c0e]/60 backdrop-blur-md px-4 pt-2 rounded-t-2xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "relative px-5 py-3 text-xs font-mono uppercase tracking-wider transition-all duration-200 whitespace-nowrap rounded-xl flex items-center gap-2 cursor-pointer",
                isActive 
                  ? "text-white font-bold bg-neutral-900 border border-neutral-800 shadow-md" 
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900/50 border border-transparent"
              )}
            >
              {isActive && <Sparkles className="w-3.5 h-3.5 text-green-400" />}
              {tab.label}
              
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-green-400 to-yellow-400 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content Container */}
      <div className="pt-6 bg-[#0c0c0e] border border-neutral-800 border-t-0 rounded-b-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}