'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, AlertTriangle, Brain, Info } from 'lucide-react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const typeConfig: Record<string, { icon: typeof AlertTriangle; color: string }> = {
  incident: { icon: AlertTriangle, color: 'text-orange-500' },
  prediction: { icon: Brain, color: 'text-blue-500' },
  system: { icon: Info, color: 'text-emerald-500' },
};

function timeAgo(date: Date, locale: string): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return locale === 'vi' ? 'Vừa xong' : 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}${locale === 'vi' ? ' phút trước' : 'm ago'}`;
  const hours = Math.floor(minutes / 60);
  return `${hours}${locale === 'vi' ? ' giờ trước' : 'h ago'}`;
}

interface NotificationBellProps {
  collapsed?: boolean;
}

export function NotificationBell({ collapsed = false }: NotificationBellProps) {
  const { notifications, unreadCount, markAllRead, clearAll, markAsRead } = useNotifications();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);
  const prevCount = useRef(unreadCount);

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    if (notif.link) {
      setOpen(false);
      router.push(notif.link);
    } else {
      setOpen(false);
      const role = user?.roles?.[0] || '';
      if (role === 'emergency') {
        router.push('/emergency/incidents');
      } else if (['traffic_operator', 'super_admin', 'city_admin', 'urban_planner'].includes(role)) {
        router.push('/dashboard/incidents');
      } else {
        router.push('/alerts');
      }
    }
  };

  // Animate bell when new notification arrives
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all ${
          animate ? 'animate-bounce' : ''
        }`}
        title={t('notifications.title')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full px-1 shadow-lg animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className={`absolute z-[100] ${
          collapsed ? 'left-full ml-2 top-0' : 'bottom-full mb-2 left-0'
        } w-[340px] max-h-[420px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-bold">{t('notifications.title')}</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title={t('notifications.markAllRead')}
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title={t('notifications.clearAll')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[340px] divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">{t('notifications.empty')}</p>
              </div>
            ) : (
              notifications.map((notif: Notification) => {
                const config = typeConfig[notif.type] || typeConfig.system;
                const Icon = config.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors ${
                      !notif.read ? 'bg-primary/[0.03]' : ''
                    } ${notif.link ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`p-1.5 rounded-lg bg-secondary/80 mt-0.5 ${config.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm truncate ${!notif.read ? 'font-semibold' : 'font-medium'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                        {timeAgo(notif.timestamp, locale)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
