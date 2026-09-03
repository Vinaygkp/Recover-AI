import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-4xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with Smooth Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Modal Dialog Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={cn(
                'w-full bg-[#0c0c0e] border border-neutral-800 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] pointer-events-auto flex flex-col max-h-[90vh] overflow-hidden relative group',
                sizes[size]
              )}
            >
              
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-800/80 bg-[#101014]/90 backdrop-blur-xl relative z-10">
                <div className="pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest font-bold">Secure Action</span>
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight font-mono">{title}</h2>
                  {description && <p className="text-xs text-neutral-400 mt-1 leading-relaxed font-mono">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="px-7 py-6 overflow-y-auto custom-scrollbar bg-[#08080a] relative z-10 text-neutral-300 text-xs font-mono">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="px-7 py-4 border-t border-neutral-800/80 bg-[#101014]/90 backdrop-blur-xl rounded-b-2xl flex justify-end gap-3 relative z-10">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}