"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { motion, useScroll, useSpring } from "framer-motion";
import LoginDialog from "@/components/auth/LoginDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Map, FileText, Bell, UserCircle, LayoutDashboard, LogOut, ChevronDown, AlertTriangle, Info, ChevronRight, CheckCheck, Trash2, Brain, Menu } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNotifications, type Notification } from "@/hooks/useNotifications";

const notifTypeConfig: Record<string, { icon: typeof AlertTriangle; color: string }> = {
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
  if (hours < 24) return `${hours}${locale === 'vi' ? ' giờ trước' : 'h ago'}`;
  const days = Math.floor(hours / 24);
  return `${days}${locale === 'vi' ? ' ngày trước' : 'd ago'}`;
}

function smoothScrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Navbar({ showScrollProgress = false }: { showScrollProgress?: boolean }) {
  const { user, logout } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { notifications, unreadCount, markAllRead, clearAll, markAsRead } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => { await logout(); router.push("/"); };
  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const isOperatorOrAdmin = user?.roles?.some((r: string) => ["traffic_operator", "city_admin", "super_admin", "emergency", "urban_planner"].includes(r));

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const navLinks = [
    { label: t('navbar.features'), action: () => smoothScrollTo('features') },
    { label: t('navbar.howItWorks'), action: () => smoothScrollTo('how-it-works') },
    { label: t('navbar.liveMap'), href: '/map' },
  ];

  return (
    <>
      {showScrollProgress && (
        <motion.div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 z-[60] origin-left" style={{ scaleX }} />
      )}

      <nav className="sticky top-0 z-50 w-full bg-background/60 backdrop-blur-2xl border-b border-border/50 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 group cursor-pointer">
              <Image src="/logo.png" alt="CivicTwin AI" width={44} height={44} className="object-contain drop-shadow-[0_0_12px_rgba(59,130,246,0.4)] transition-transform group-hover:scale-105" unoptimized priority />
              <span className="text-2xl font-bold tracking-tight text-foreground font-heading">
                CivicTwin<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">AI</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            {navLinks.map((link, i) =>
              link.href ? (
                <Link key={i} href={link.href} className="hover:text-foreground transition-colors">{link.label}</Link>
              ) : (
                <button key={i} onClick={link.action} className="hover:text-foreground transition-colors cursor-pointer">{link.label}</button>
              )
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2.5">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>

            {/* Notification Bell */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="relative p-2.5 rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full ring-2 ring-background animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="relative w-80 !bg-popover !border-border shadow-2xl shadow-foreground/10 rounded-xl p-0 overflow-hidden">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-4 py-3 flex items-center justify-between !text-foreground">
                      <span className="text-sm font-bold !text-foreground">{t('navbar.notifications')}</span>
                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <button onClick={(e) => { e.stopPropagation(); markAllRead(); }} className="p-1 rounded-md hover:bg-accent transition-colors" title={t('notifications.markAllRead')}>
                            <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button onClick={(e) => { e.stopPropagation(); clearAll(); }} className="p-1 rounded-md hover:bg-destructive/10 transition-colors" title={t('notifications.clearAll')}>
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full !bg-rose-500/10 !text-rose-400 !border !border-rose-500/20 ml-1">
                            {t('navbar.newCount', { n: String(unreadCount) })}
                          </span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="!bg-secondary m-0" />
                  <div className="relative max-h-[320px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <Bell className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">{t('notifications.empty')}</p>
                      </div>
                    ) : (
                      notifications.map((notif: Notification, i: number) => {
                        const config = notifTypeConfig[notif.type] || notifTypeConfig.system;
                        const Icon = config.icon;
                        return (
                          <DropdownMenuGroup key={notif.id}>
                            <DropdownMenuItem
                              onClick={() => {
                                if (!notif.read) markAsRead(notif.id);
                                if (notif.link) router.push(notif.link);
                                else if (user?.roles?.includes('emergency')) router.push('/emergency/incidents');
                                else if (isOperatorOrAdmin) router.push('/dashboard/incidents');
                                else router.push('/alerts');
                              }}
                              className={`px-4 py-3.5 gap-3 rounded-none cursor-pointer focus:!bg-secondary/80 hover:!bg-secondary/80 transition-colors ${notif.read ? "!opacity-60" : ""}`}
                            >
                              <div className={`shrink-0 mt-0.5 p-1.5 rounded-lg bg-secondary/80 ${config.color}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm truncate ${!notif.read ? "font-semibold !text-foreground" : "font-medium !text-muted-foreground"}`}>{notif.title}</p>
                                  {!notif.read && <div className="w-2 h-2 rounded-full shrink-0 bg-primary" />}
                                </div>
                                <p className="text-xs !text-muted-foreground mt-0.5 line-clamp-1">{notif.message}</p>
                                <p className="text-[10px] !text-muted-foreground mt-1 font-medium">{timeAgo(notif.timestamp, locale)}</p>
                              </div>
                            </DropdownMenuItem>
                            {i < notifications.length - 1 && <DropdownMenuSeparator className="!bg-secondary m-0" />}
                          </DropdownMenuGroup>
                        );
                      })
                    )}
                  </div>
                  <DropdownMenuSeparator className="!bg-secondary m-0" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => {
                        if (user?.roles?.includes('emergency')) router.push('/emergency/incidents');
                        else if (isOperatorOrAdmin) router.push('/dashboard/incidents');
                        else router.push('/alerts');
                      }}
                      className="px-4 py-2.5 rounded-none cursor-pointer justify-center gap-1.5 text-xs font-semibold !text-blue-400 focus:!bg-secondary/80 hover:!bg-secondary/80"
                    >
                      {t('navbar.viewAllAlerts')}
                      <ChevronRight className="w-3.5 h-3.5 !text-blue-400" />
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Avatar */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/50 rounded-full pl-1.5 pr-3 py-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer group">
                  <Avatar className="w-7 h-7 border border-border/60">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-foreground text-xs font-bold">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-foreground hidden sm:block max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="relative w-56 !bg-popover !border-border shadow-2xl shadow-foreground/10 rounded-xl p-1.5">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-3 py-2.5 !text-foreground">
                      <p className="text-sm font-bold truncate !text-foreground">{user.name}</p>
                      <p className="text-xs truncate !text-muted-foreground">{user.email}</p>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="!bg-secondary" />
                  <DropdownMenuGroup>
                    {[
                      { icon: <Map className="w-4 h-4 !text-blue-400" />, label: t('navbar.liveMap'), href: "/map" },
                      { icon: <FileText className="w-4 h-4 !text-emerald-400" />, label: t('navbar.myReports'), href: "/my-reports" },
                      { icon: <UserCircle className="w-4 h-4 !text-indigo-400" />, label: t('navbar.profile'), href: "/profile" },
                    ].map((item) => (
                      <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)} className="px-3 py-2.5 rounded-lg cursor-pointer gap-3 focus:!bg-secondary/80 hover:!bg-secondary/80 !text-foreground transition-colors">
                        {item.icon}{item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  {isOperatorOrAdmin && (
                    <>
                      <DropdownMenuSeparator className="!bg-secondary" />
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => router.push("/dashboard")} className="px-3 py-2.5 rounded-lg cursor-pointer gap-3 focus:!bg-secondary/80 hover:!bg-secondary/80 !text-foreground transition-colors">
                          <LayoutDashboard className="w-4 h-4 !text-cyan-400" />{t('navbar.operatorDashboard')}
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </>
                  )}
                  <DropdownMenuSeparator className="!bg-secondary" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleLogout} className="px-3 py-2.5 rounded-lg cursor-pointer gap-3 focus:!bg-rose-500/10 hover:!bg-rose-500/10 !text-rose-400 transition-colors">
                      <LogOut className="w-4 h-4" />{t('navbar.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:block">
                <LoginDialog />
              </div>
            )}

            {/* Mobile Hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="md:hidden p-2.5 rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 transition-all cursor-pointer">
                <Menu className="w-4 h-4 text-muted-foreground" />
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-6">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-left font-heading">CivicTwin<span className="text-blue-500">AI</span></SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1">
                  {navLinks.map((link, i) =>
                    link.href ? (
                      <Link key={i} href={link.href} onClick={() => setMobileOpen(false)} className="py-3 px-4 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors">{link.label}</Link>
                    ) : (
                      <button key={i} onClick={() => { link.action?.(); setMobileOpen(false); }} className="py-3 px-4 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors text-left cursor-pointer">{link.label}</button>
                    )
                  )}
                </div>
                <div className="mt-6 pt-6 border-t border-border flex items-center gap-3">
                  <ThemeToggle />
                  <LanguageSwitcher />
                </div>
                {!user && <div className="mt-6"><LoginDialog /></div>}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </>
  );
}
