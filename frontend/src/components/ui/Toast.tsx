import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const icons = {
    success: <CheckCircle className="h-4 w-4 text-green-400" />,
    error: <XCircle className="h-4 w-4 text-red-400" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
    info: <Info className="h-4 w-4 text-blue-400" />
  };

  const borderGlow = {
    success: 'border-green-500/30 bg-green-500/[0.03] shadow-[0_10px_30px_rgba(34,197,94,0.15)]',
    error: 'border-red-500/30 bg-red-500/[0.03] shadow-[0_10px_30px_rgba(239,68,68,0.15)]',
    warning: 'border-amber-500/30 bg-amber-500/[0.03] shadow-[0_10px_30px_rgba(245,158,11,0.15)]',
    info: 'border-blue-500/30 bg-blue-500/[0.03] shadow-[0_10px_30px_rgba(59,130,246,0.15)]'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto flex items-start gap-3.5 w-84 sm:w-96 bg-[#0c0c0e] border rounded-2xl p-4.5 backdrop-blur-2xl relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.9)]",
        borderGlow[toast.type]
      )}
    >
      {/* Background radial accent glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />

      <div className={cn(
        "flex-shrink-0 mt-0.5 p-2 rounded-xl border shadow-inner",
        toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
        toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
        toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
        'bg-blue-500/10 border-blue-500/20 text-blue-400'
      )}>
        {icons[toast.type]}
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3 h-3 text-green-400" />
          <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">{toast.title}</p>
        </div>
        {toast.message && <p className="text-xs text-neutral-300 font-mono leading-relaxed">{toast.message}</p>}
      </div>

      <button 
        type="button"
        onClick={onRemove} 
        className="flex-shrink-0 text-neutral-500 hover:text-white p-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer"
        title="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export const Toast = ToastProvider;