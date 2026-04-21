'use client';

import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Map, AlertTriangle, Route, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NotificationBell } from '@/components/NotificationBell';

function EmergencyGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const EMERGENCY_NAV = [
    { href: '/emergency', icon: Map, label: t('emergency.situationMap') },
    { href: '/emergency/incidents', icon: AlertTriangle, label: t('emergency.activeIncidents') },
    { href: '/emergency/priority-route', icon: Route, label: t('emergency.priorityRoute') },
  ];

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else {
        const hasAccess = user.roles?.includes('emergency') || user.roles?.includes('super_admin') || user.roles?.includes('city_admin') || user.roles?.includes('urban_planner');
        if (!hasAccess) {
          router.push('/unauthorized');
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex relative">
      {/* Emergency Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-[72px] lg:w-[240px] bg-card/95 backdrop-blur-3xl border-r border-rose-500/10 transition-all duration-300 flex flex-col items-center lg:items-stretch shadow-2xl">
        {/* Brand */}
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-5 border-b border-border bg-rose-500/5">
          <div className="flex items-center justify-center relative shrink-0 group">
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="relative z-10 object-contain drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]" unoptimized />
          </div>
          <div className="hidden lg:flex flex-col ml-3">
            <span className="text-base font-bold font-heading tracking-wider">{t('emergencySidebar.title')}</span>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] mt-0.5">{t('emergencySidebar.responseUnit')}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 w-full py-6 flex flex-col gap-2 px-3 overflow-y-auto">
          {EMERGENCY_NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/emergency' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3.5 rounded-xl transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden lg:block text-sm font-semibold tracking-wide flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border flex flex-col gap-2 bg-muted/10">
          <div className="hidden lg:flex flex-col px-2 py-1 mb-2">
            <span className="text-xs font-semibold text-foreground truncate">{user?.name || t('emergencySidebar.emergencyUnit')}</span>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
              {user?.roles?.[0] ? t(`enums.roles.${user.roles[0]}`) : t('emergencySidebar.emergencyRole')}
            </span>
          </div>
          <div className="flex items-center justify-center lg:justify-between px-2 pt-1 pb-2">
            <span className="hidden lg:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('sidebar.theme')}</span>
            <div className="flex items-center gap-1">
              <NotificationBell collapsed={false} />
              <LanguageSwitcher />
              <ThemeToggle collapsed={false} />
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 rounded-xl text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:block text-sm font-bold tracking-wide">{t('auth.logout')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 transition-all duration-300 pl-[72px] lg:pl-[240px] min-w-0">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function EmergencyLayout({ children }: { children: React.ReactNode }) {
  return <EmergencyGuard>{children}</EmergencyGuard>;
}
