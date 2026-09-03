import React, { useState } from 'react';
import { Card } from './Card';
import { Edit2, Check, X, Sliders, Loader2 } from 'lucide-react';

interface PolicyItem {
  id: string;
  name: string;
  description: string;
  value: any;
}

interface PolicyCardProps {
  policy: PolicyItem;
  onUpdate: (id: string, value: string | boolean | number) => Promise<void>;
}

export function PolicyCard({ policy, onUpdate }: PolicyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<any>(policy.value);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdate(policy.id, value as string | number | boolean);
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="interactive" className="p-6 flex flex-col justify-between relative group">
      
      {/* Background Neon Accent Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all pointer-events-none" />

      <div>
        <div className="flex justify-between items-start mb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-green-400 shadow-inner">
              <Sliders className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white text-sm font-mono tracking-tight">{policy.name}</h3>
          </div>
          {!isEditing && (
            <button 
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all cursor-pointer"
              title="Edit Policy"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed font-mono relative z-10">{policy.description}</p>
      </div>

      <div className="mt-auto relative z-10">
        {isEditing ? (
          <div className="flex items-center gap-2.5">
            {typeof policy.value === 'boolean' ? (
              <select 
                value={String(value)} 
                onChange={(e) => setValue(e.target.value === 'true')}
                className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white flex-1 focus:outline-none focus:border-green-500 transition-all shadow-inner"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            ) : (
              <input 
                type={typeof policy.value === 'number' ? 'number' : 'text'}
                value={value !== undefined && value !== null ? String(value) : ''}
                onChange={(e) => setValue(typeof policy.value === 'number' ? Number(e.target.value) : e.target.value)}
                className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white flex-1 focus:outline-none focus:border-green-500 transition-all shadow-inner"
              />
            )}
            <button 
              type="button"
              onClick={handleSave} 
              disabled={isLoading} 
              className="p-2.5 bg-green-500 text-black rounded-xl hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] disabled:opacity-50 cursor-pointer"
              title="Save changes"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button 
              type="button"
              onClick={() => { setIsEditing(false); setValue(policy.value); }} 
              disabled={isLoading} 
              className="p-2.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900/90 px-4 py-2.5 rounded-xl border border-neutral-800 inline-flex items-center gap-2 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-green-400">
              {typeof policy.value === 'boolean' ? (policy.value ? 'Enabled' : 'Disabled') : String(policy.value ?? '')}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}