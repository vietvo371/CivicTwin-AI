'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useEchoMulti } from '@/hooks/useEcho';
import {
  Activity, AlertTriangle, Clock, Brain, TrendingUp,
  ShieldAlert, CheckCircle2, ArrowUpRight, ChevronRight,
  Zap, Users, Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const TrafficMap = dynamic(() => import('@/components/TrafficMap'), { ssr: false });

const severityStyle: Record<string, string> = {
  low: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  critical: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
};

const statusStyle: Record<string, { color: string; icon: React.ReactNode }> = {
  open: { color: 'text-blue-400', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  investigating: { color: 'text-amber-400', icon: <Clock className="w-3.5 h-3.5" /> },
  resolved: { color: 'text-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: { value: string; up: boolean };
  accentColor: string;
  sparkline?: number[];
  sparkColor?: string;
}

function Sparkline({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 28, pad = 2;
  const points = data.map((v, i) => `${pad + (i / (data.length - 1)) * (w - pad * 2)},${h - pad - ((v - min) / range) * (h - pad * 2)}`).join(' ');
  const id = `sg-${color.replace('#', '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 opacity-80">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${pad},${h} ${points.split(' ').map(p => `L${p}`).join(' ')} L${w - pad},${h} Z`} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KPICardSkeleton() {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/80 shadow-lg overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="w-14 h-6 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
        <div className="h-3 w-28 bg-muted animate-pulse rounded mb-1.5" />
        <div className="h-3 w-36 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

function SidebarItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-background/50">
      <div className="w-2 h-2 rounded-full bg-muted animate-pulse mt-2" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}

function KPICard({ title, value, subtitle, icon, trend, accentColor, sparkline, sparkColor }: KPICardProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/80 shadow-lg hover:shadow-xl hover:border-border transition-all group relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${accentColor} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-secondary/80 border border-border/50 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          {trend && (
            <span className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-full ${trend.up ? 'text-rose-500 bg-rose-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
              <TrendingUp className={`w-3 h-3 ${trend.up ? '' : 'rotate-180'}`} />
              {trend.value}
            </span>
          )}
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-3xl font-heading font-black tracking-tight mb-1">{value}</div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          </div>
          {sparkline && sparkline.length > 1 && <Sparkline data={sparkline} color={sparkColor} />}
        </div>
        <p className="text-xs text-muted-foreground mt-2 font-medium">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Incident = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AIJob = Record<string, any>;

export default function DashboardPage() {
  const { t, locale } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [aiFeed, setAiFeed] = useState<AIJob[]>([]);
  const [pendingRecs, setPendingRecs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [incRes, predRes, recRes] = await Promise.allSettled([
          api.get('/incidents?per_page=10'),
          api.get('/predictions?per_page=5'),
          api.get('/recommendations?status=pending&per_page=100'),
        ]);

        if (incRes.status === 'fulfilled' && incRes.value.data?.data?.length > 0) {
          setIncidents(incRes.value.data.data);
        }
        if (predRes.status === 'fulfilled' && predRes.value.data?.data) {
          setAiFeed(predRes.value.data.data);
        }
        if (recRes.status === 'fulfilled' && recRes.value.data?.data) {
          setPendingRecs(recRes.value.data.data.length);
        }
      } catch {
        // fallback: keep empty arrays
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Real-time WebSocket listeners
  useEchoMulti('traffic', {
    IncidentCreated: (data: any) => {
      setIncidents(prev => [data, ...prev.slice(0, 9)]);
    },
    PredictionReceived: (data: any) => {
      setAiFeed(prev => [data, ...prev.slice(0, 4)]);
    },
  });

  const openCount = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.commandCenter')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('op.systemsOnline')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {t('op.lastSync')}: {new Date().toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>{Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}</>
        ) : (
          <>
            <KPICard
              title={t('op.activeIncidents')}
              value={openCount}
              subtitle={t('op.totalThisPeriod', { n: String(incidents.length) })}
              icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
              trend={openCount > 0 ? { value: `${openCount}`, up: true } : undefined}
              accentColor="from-orange-500 to-amber-500"
              sparkline={incidents.slice(0, 7).map((_, i) => Math.max(1, openCount - i + Math.floor(Math.random() * 3)))}
              sparkColor="#f97316"
            />
            <KPICard
              title={t('op.aiPredictions')}
              value={aiFeed.filter(a => a.status === 'completed').length}
              subtitle={t('op.sessionsTotal', { n: String(aiFeed.length) })}
              icon={<Brain className="w-5 h-5 text-violet-500" />}
              trend={aiFeed.length > 0 ? { value: `${Math.round((aiFeed.filter(a => a.status === 'completed').length / Math.max(1, aiFeed.length)) * 100)}%`, up: false } : undefined}
              accentColor="from-violet-500 to-purple-500"
              sparkline={aiFeed.slice(0, 7).map(a => a.processing_time_ms || 100)}
              sparkColor="#8b5cf6"
            />
            <KPICard
              title={t('op.pendingActions')}
              value={pendingRecs}
              subtitle={t('op.awaitingReview')}
              icon={<Timer className="w-5 h-5 text-blue-500" />}
              accentColor="from-blue-500 to-cyan-500"
              sparkline={[pendingRecs, Math.max(0, pendingRecs - 1), pendingRecs + 2, pendingRecs, Math.max(0, pendingRecs - 2), pendingRecs + 1, pendingRecs]}
              sparkColor="#3b82f6"
            />
            <KPICard
              title={t('op.resolutionRate')}
              value={incidents.length > 0 ? `${Math.round((incidents.filter(i => i.status === 'resolved').length / incidents.length) * 100)}%` : '0%'}
              subtitle={t('op.incidentsResolved', { resolved: String(incidents.filter(i => i.status === 'resolved').length), total: String(incidents.length) })}
              icon={<Users className="w-5 h-5 text-emerald-500" />}
              accentColor="from-emerald-500 to-teal-500"
              sparkline={[40, 55, 48, 62, 58, 70, incidents.length > 0 ? Math.round((incidents.filter(i => i.status === 'resolved').length / incidents.length) * 100) : 0]}
              sparkColor="#10b981"
            />
          </>
        )}
      </div>

      {/* Main Content: Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Traffic Map */}
        <div className="lg:col-span-8">
          <Card className="bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden border-border/80">
            <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                {t('op.liveTrafficGrid')}
              </CardTitle>
              <Link href="/dashboard" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                {t('op.fullScreen')} <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="h-[500px] rounded-xl overflow-hidden border border-border/50 relative">
                <TrafficMap hideOverlays />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Incidents */}
          <Card className="bg-card/40 backdrop-blur-xl shadow-2xl border-border/80">
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                {t('op.recentIncidents')}
              </CardTitle>
              <Link href="/dashboard/incidents" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                {t('op.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-2">
                {loading ? Array.from({ length: 4 }).map((_, i) => <SidebarItemSkeleton key={i} />) : incidents.slice(0, 5).map((inc) => {
                  const sev = severityStyle[inc.severity] || severityStyle.medium;
                  const stat = statusStyle[inc.status] || statusStyle.open;
                  return (
                    <Link
                      key={inc.id}
                      href="/dashboard/incidents"
                      className="flex items-start gap-3 p-3 rounded-xl bg-background/50 hover:bg-accent/50 border border-transparent hover:border-border transition-all group/item cursor-pointer"
                    >
                      <div className="mt-0.5 shrink-0">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${inc.status === 'open' ? 'bg-blue-500 animate-pulse' : inc.status === 'investigating' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover/item:text-primary transition-colors">{inc.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 h-5 border ${sev}`}>
                            {t(`enums.incidentSeverity.${inc.severity}`)}
                          </Badge>
                          <span className={`text-[11px] font-medium flex items-center gap-1 ${stat.color}`}>
                            {stat.icon}
                            {t(`enums.incidentStatus.${inc.status}`)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Activity Feed */}
          <Card className="bg-card/40 backdrop-blur-xl shadow-2xl border-border/80">
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-500" />
                {t('op.aiActivity')}
              </CardTitle>
              <Link href="/dashboard/predictions" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                {t('op.details')} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-2">
                {aiFeed.map((ai) => (
                  <div
                    key={ai.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-transparent hover:border-border transition-all"
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className={`p-1.5 rounded-lg ${ai.status === 'completed' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        <Zap className={`w-3.5 h-3.5 ${ai.status === 'completed' ? 'text-emerald-500' : 'text-rose-500'}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">Job #{ai.id}</p>
                        <Badge variant={ai.status === 'completed' ? 'outline' : 'destructive'} className="text-[9px] uppercase tracking-wider h-5">
                          {t(`enums.predictionStatus.${ai.status}`)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground font-medium">
                        <span>{t('op.incidentRef', { id: String(ai.incident_id) })}</span>
                        <span className="text-border">|</span>
                        <span>{ai.model_version}</span>
                        <span className="text-border">|</span>
                        <span>{ai.processing_time_ms}ms</span>
                      </div>
                      {(ai.prediction_edges?.length || ai.edges_affected || 0) > 0 && (
                         <p className="text-[11px] text-primary/80 font-semibold mt-1">
                           {t('op.segmentsAnalyzed', { n: String(ai.prediction_edges?.length || ai.edges_affected) })}
                         </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
