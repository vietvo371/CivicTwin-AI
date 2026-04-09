'use client';

import Image from 'next/image';

import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Map, AlertTriangle, Brain, Lightbulb, BarChart3,
  LogOut, Menu, X, Activity, FlaskConical, Camera,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationBell } from './NotificationBell';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navItems = [
    { href: '/dashboard', icon: Map, labelKey: 'sidebar.trafficMap' },
    { href: '/dashboard/incidents', icon: AlertTriangle, labelKey: 'sidebar.incidents' },
    { href: '/dashboard/predictions', icon: Brain, labelKey: 'sidebar.predictions' },
    { href: '/dashboard/simulation', icon: FlaskConical, labelKey: 'sidebar.simulation' },
    { href: '/dashboard/recommendations', icon: Lightbulb, labelKey: 'sidebar.recommendations' },
    { href: '/dashboard/cctv', icon: Camera, labelKey: 'sidebar.cctvMonitor' },
    { href: '/dashboard/analytics', icon: BarChart3, labelKey: 'sidebar.analytics' },
  ];

  // Auto-collapse on mobile/tablet
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out border-r border-border bg-card/95 backdrop-blur-xl ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo Area */}
      <div className="flex items-center gap-3 p-4 h-[72px] border-b border-border bg-muted/20">
        <div className="flex items-center justify-center shrink-0 relative group">
          <Image src="/logo.png" alt="CivicTwin AI Logo" width={40} height={40} className="object-contain w-10 h-10 relative z-10 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-transform duration-300 group-hover:scale-110" unoptimized />
        </div>
        
        <div className={`flex flex-col min-w-0 transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 flex-1'}`}>
          <span className="font-heading font-bold text-[15px] tracking-tight text-foreground truncate">CivicTwin AI</span>
          <span className="text-[10px] font-bold text-muted-foreground truncate tracking-widest uppercase mt-0.5">{t('sidebar.commandCenter')}</span>
        </div>

        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 ml-auto rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const label = t(item.labelKey);
          
          const linkEl = (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 min-h-[44px] rounded-xl transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium'
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110 text-primary' : 'group-hover:scale-110'}`} />

              <span className={`text-sm whitespace-nowrap transition-all duration-200 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 flex-1'}`}>
                {label}
              </span>

              {isActive && !collapsed && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={<Link href={item.href} />} className={`flex items-center gap-3 px-3 min-h-[44px] rounded-xl transition-all duration-200 group cursor-pointer ${
                  isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium'
                }`}>
                  <item.icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110 text-primary' : 'group-hover:scale-110'}`} />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkEl;
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-border bg-muted/10">
        <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 font-heading font-bold flex items-center justify-center shrink-0">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          
          <div className={`flex flex-col min-w-0 transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 flex-1'}`}>
            <span className="text-sm font-semibold text-foreground truncate">{user?.name}</span>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase truncate">
              {user?.roles?.[0] ? t(`enums.roles.${user.roles[0]}`) : t('sidebar.operator')}
            </span>
          </div>

          <button 
            onClick={logout}
            title={t('auth.logout')} 
            className={`p-2 rounded-lg shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ${collapsed ? 'hidden' : ''}`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Language & Theme Toggle */}
        <div className={`flex items-center ${collapsed ? 'justify-center flex-col gap-2' : 'justify-between px-2'} pt-1`}>
          {!collapsed && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('sidebar.theme')}</span>}
          <div className="flex items-center gap-1">
            <NotificationBell collapsed={collapsed} />
            <LanguageSwitcher />
            <ThemeToggle collapsed={collapsed} />
          </div>
        </div>
      </div>
    </aside>
  );
}
