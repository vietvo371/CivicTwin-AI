'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck, Users, Database, LogOut, Settings, ActivitySquare, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationBell } from './NotificationBell';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  const ADMIN_NAVIGATION = [
    { name: t('nav.dashboard'), href: '/admin', icon: ShieldCheck },
    { name: t('nav.users'), href: '/admin/users', icon: Users },
    { name: t('nav.masterData'), href: '/admin/master', icon: Database },
    { name: t('nav.settings'), href: '/admin/settings', icon: Settings },
    { name: t('nav.logs'), href: '/admin/logs', icon: ActivitySquare },
    { name: t('navbar.operatorDashboard'), href: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[72px] lg:w-[260px] bg-card/95 backdrop-blur-3xl border-r border-border transition-all duration-300 flex flex-col items-center lg:items-stretch shadow-2xl">
      {/* Brand */}
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-border bg-muted/20">
        <div className="flex items-center justify-center relative shrink-0 group">
          <Image src="/logo.png" alt="CivicTwin AI Logo" width={40} height={40} className="relative z-10 object-contain w-10 h-10 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-transform duration-300 group-hover:scale-110" unoptimized />
        </div>
        <div className="hidden lg:flex flex-col ml-3">
          <span className="text-lg font-bold font-heading text-foreground tracking-wider">CivicTwin</span>
          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em] mt-0.5">City Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full py-6 flex flex-col gap-2 px-3 overflow-y-auto no-scrollbar">
        {ADMIN_NAVIGATION.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3.5 rounded-xl transition-all duration-200 relative overflow-hidden ${
                isActive 
                  ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block text-sm font-semibold tracking-wide flex-1 truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Actions */}
      <div className="p-4 border-t border-border flex flex-col gap-2 bg-muted/10">
        <div className="hidden lg:flex flex-col px-2 py-1 mb-2">
          <span className="text-xs font-semibold text-foreground truncate">{user?.name || 'Administrator'}</span>
          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">
            {user?.roles?.[0] ? t(`enums.roles.${user.roles[0]}`) : 'Admin'}
          </span>
        </div>
        
        <div className="flex items-center justify-center lg:justify-between px-2 pt-1 pb-2 gap-2">
          <span className="hidden lg:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('sidebar.theme')}</span>
          <div className="flex items-center gap-1">
            <NotificationBell collapsed={false} />
            <LanguageSwitcher />
            <ThemeToggle collapsed={false} />
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors border border-transparent hover:border-destructive/20"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="hidden lg:block text-sm font-bold tracking-wide">{t('auth.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
