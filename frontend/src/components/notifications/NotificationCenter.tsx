import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Sparkles, ShieldAlert, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { notificationService } from '../../services/notifications';
import { timeAgo } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface NotificationItem {
  id?: string;
  _id?: string;
  is_read?: boolean;
  read?: boolean;
  type?: string;
  title?: string;
  message?: string;
  created_at?: string;
  [key: string]: unknown;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch real notifications dynamically from backend API
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.list(),
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 30000
  });

  const rawNotifications: NotificationItem[] = data?.items || (Array.isArray(data) ? data : []);

  // Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadCount = rawNotifications.filter((n) => !n.is_read && !n.read).length;

  const markAllAsRead = async () => {
    for (const n of rawNotifications) {
      if (!n.is_read && !n.read) {
        const idToMark = n.id || n._id;
        if (idToMark) {
          await notificationService.markRead(idToMark);
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="relative inline-block">
      <button 
        type="button"
        className="relative p-2.5 text-neutral-300 hover:text-white transition-all duration-200 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
        onClick={() => {
          setIsOpen(!isOpen);
          refetch();
        }}
        aria-label="Toggle notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-[#0a0a0a] flex items-center justify-center text-[9px] font-mono font-extrabold text-white shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-84 sm:w-96 bg-[#0c0c0e] border border-neutral-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[999] overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="px-5 py-3.5 border-b border-neutral-800/80 flex justify-between items-center bg-neutral-900/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-400" />
              <h3 className="font-semibold text-white text-sm font-mono tracking-wide">Telemetry Alerts</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
              {unreadCount > 0 && (
                <button 
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-mono text-neutral-400 hover:text-white transition-colors underline underline-offset-2 cursor-pointer bg-transparent border-none"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-neutral-900">
            {isLoading ? (
              <div className="px-6 py-12 text-center text-neutral-500 text-xs font-mono flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-green-400" /> Loading notifications...
              </div>
            ) : rawNotifications.length === 0 ? (
              <div className="px-6 py-12 text-center text-neutral-500 text-xs font-mono">
                No notifications found in telemetry database
              </div>
            ) : (
              rawNotifications.map((n) => {
                const isUnread = !(n.is_read || n.read);
                const nType = String(n.type || 'info');
                const notificationId = n.id || n._id || Math.random().toString();
                return (
                  <div 
                    key={notificationId} 
                    className={`px-5 py-4 transition-all duration-200 hover:bg-neutral-900/80 relative group ${
                      isUnread ? 'bg-green-500/[0.04]' : 'opacity-70'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-2 rounded-xl border ${
                          nType.includes('stop') || nType.includes('violation') || nType.includes('spike') 
                            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                            : nType.includes('success') 
                            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        }`}>
                          {nType.includes('stop') || nType.includes('violation') ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white font-mono tracking-tight">{n.title || 'System Notification'}</p>
                          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {timeAgo(n.created_at || new Date().toISOString())}
                          </p>
                        </div>
                      </div>

                      {isUnread && notificationId && (
                        <button 
                          type="button"
                          onClick={() => markReadMutation.mutate(notificationId)} 
                          className="text-neutral-400 hover:text-green-400 p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-green-500/40 transition-all shrink-0 cursor-pointer"
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-5 py-3 bg-neutral-900/80 border-t border-neutral-800/80 text-center">
            <Link 
              to="/dashboard/audit" 
              onClick={() => setIsOpen(false)}
              className="text-xs font-mono text-neutral-400 hover:text-green-400 transition-colors flex items-center justify-center gap-1"
            >
              View audit log telemetry &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}