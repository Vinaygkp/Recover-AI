import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

export function formatTime(date: string | Date): string {
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(date));
  } catch {
    return '';
  }
}

export function formatPercentage(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '0.0%';
  return `${(value * 100).toFixed(1)}%`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    detected: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[0_0_10px_rgba(96,165,250,0.15)]',
    in_progress: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.15)]',
    recovered: 'text-green-400 bg-green-500/10 border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.15)]',
    failed: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.15)]',
    stopped: 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20 shadow-[0_0_10px_rgba(115,115,115,0.15)]',
    manual_review: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.15)]',
    success: 'text-green-400 bg-green-500/10 border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.15)]',
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.15)]',
  };
  return colors[status] || 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'text-neutral-400',
    medium: 'text-amber-400 font-semibold',
    high: 'text-red-400 font-bold',
  };
  return colors[priority] || 'text-neutral-400';
}

export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  return `${name.charAt(0)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  if (phone.length <= 4) return '****';
  return `****${phone.slice(-4)}`;
}

export function timeAgo(date: string | Date): string {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '';
  }
}