'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import {
  BarChart3, TrendingUp, AlertOctagon, Clock,
  RefreshCw, Gauge, MapPin, ShieldCheck, Cpu
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TimelineChart = dynamic(() => import('@/components/AnalyticsCharts').then(m => m.TimelineChart), { ssr: false, loading: () => <ChartSkeleton /> });
const SeverityPieChart = dynamic(() => import('@/components/AnalyticsCharts').then(m => m.SeverityPieChart), { ssr: false, loading: () => <ChartSkeleton /> });
const DensityHistogram = dynamic(() => import('@/components/AnalyticsCharts').then(m => m.DensityHistogram), { ssr: false, loading: () => <ChartSkeleton /> });
const TypeBarChart = dynamic(() => import('@/components/AnalyticsCharts').then(m => m.TypeBarChart), { ssr: false, loading: () => <ChartSkeleton /> });

function ChartSkeleton() {
  return (
    <div className="h-[240px] w-full p-4 space-y-3">
      <div className="flex items-end gap-2 h-full">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-1 bg-muted animate-pulse rounded-t" style={{ height: `${30 + Math.random() * 60}%`, animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-2 w-10 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#10b981', medium: '#eab308', high: '#f97316', critical: '#f43f5e',
};
const TYPE_COLORS: Record<string, string> = {
  accident: '#f43f5e', congestion: '#f97316', construction: '#eab308',
  weather: '#3b82f6', other: '#6b7280',
};
const CONGESTION_COLORS: Record<string, string> = {
  none: '#10b981', light: '#22d3ee', moderate: '#eab308', heavy: '#f43f5e',
};
const DENSITY_COLORS = ['#10b981', '#22d3ee', '#eab308', '#f97316', '#f43f5e'];

interface Analytics {
  kpis: {
    total_incidents: number;
    open_incidents: number;
    resolved_incidents: number;
    resolution_rate: number;
    total_predictions: number;
    completed_predictions: number;
    avg_processing_time_ms: number;
    total_edges: number;
    congested_edges: number;
    avg_density: number;
    avg_confidence: number;
    avg_predicted_density: number;
  };
  severity_distribution: Record<string, number>;
  type_distribution: Record<string, number>;
  congestion_distribution: Record<string, number>;
  density_histogram: { range: string; count: number }[];
  top_congested: { id: number; name: string; current_density: number; current_speed_kmh: number; congestion_level: string }[];
  incident_timeline: { date: string; count: number }[];
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/overview');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const severityData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.severity_distribution).map(([key, value]) => ({
      name: t(`enums.incidentSeverity.${key}`),
      value,
      color: SEVERITY_COLORS[key] || '#6b7280',
    }));
  }, [data, t]);

  const typeData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.type_distribution).map(([key, value]) => ({
      name: t(`enums.incidentType.${key}`),
      value,
      fill: TYPE_COLORS[key] || '#6b7280',
    }));
  }, [data, t]);

  const congestionData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.congestion_distribution).map(([key, value]) => ({
      name: t(`enums.congestionLevel.${key}`),
      value,
      color: CONGESTION_COLORS[key] || '#6b7280',
    }));
  }, [data, t]);

  if (loading && !data) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis } = data;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('op.trafficAnalytics')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('op.analyticsSubtitle')}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('op.refreshData')}
        </Button>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon={AlertOctagon} color="rose" label={t('op.totalIncidents')} value={kpis.total_incidents} sub={`${kpis.open_incidents} ${t('op.activeNow')}`} />
        <KPICard icon={ShieldCheck} color="emerald" label={t('op.resolutionRate')} value={`${kpis.resolution_rate}%`} sub={`${kpis.resolved_incidents}/${kpis.total_incidents}`} />
        <KPICard icon={Cpu} color="blue" label={t('op.aiSessions')} value={kpis.total_predictions} sub={`${kpis.completed_predictions} ${t('op.completedRuns')}`} />
        <KPICard icon={Clock} color="amber" label={t('op.avgProcessingTime')} value={`${kpis.avg_processing_time_ms}ms`} sub={t('op.aiPredictionSpeed')} />
        <KPICard icon={Gauge} color="orange" label={t('op.avgDensity')} value={`${(kpis.avg_density * 100).toFixed(0)}%`} sub={`${kpis.congested_edges}/${kpis.total_edges} ${t('op.congested')}`} />
        <KPICard icon={TrendingUp} color="violet" label={t('op.aiConfidence')} value={`${(kpis.avg_confidence * 100).toFixed(0)}%`} sub={t('op.avgConfidence')} />
      </div>

      {/* ─── Row 1: Timeline + Severity Pie ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{t('op.incidentTimeline')}</CardTitle>
            <CardDescription>{t('op.incidentsOverTime')}</CardDescription>
          </CardHeader>
          <CardContent>
            <TimelineChart data={data.incident_timeline} label={t('op.totalIncidents')} />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{t('op.incidentsBySeverity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <SeverityPieChart data={severityData} />
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 2: Density Histogram + Congestion Breakdown ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{t('op.densityDistribution')}</CardTitle>
            <CardDescription>{t('op.edgeDensityBuckets')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DensityHistogram data={data.density_histogram} label={t('op.edgesCount')} />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{t('op.incidentsByType')}</CardTitle>
            <CardDescription>{t('op.breakdownByCategory')}</CardDescription>
          </CardHeader>
          <CardContent>
            <TypeBarChart data={typeData} label={t('op.totalIncidents')} />
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 3: Top Congested Roads ─── */}
      <Card className="bg-card/50 backdrop-blur-xl shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">{t('op.topCongestedRoads')}</CardTitle>
              <CardDescription>{t('op.currentDensityRanking')}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-[10px]">{t('op.realtime')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.top_congested.map((edge, i) => {
              const pct = Math.round(edge.current_density * 100);
              const barColor = pct < 30 ? 'bg-emerald-500' : pct < 60 ? 'bg-amber-500' : pct < 80 ? 'bg-orange-500' : 'bg-rose-500';
              const textColor = pct < 30 ? 'text-emerald-500' : pct < 60 ? 'text-amber-500' : pct < 80 ? 'text-orange-500' : 'text-rose-500';
              return (
                <div key={edge.id} className="flex items-center gap-3 p-3 bg-background/50 rounded-xl border hover:border-border transition-colors">
                  <span className="text-xs font-bold text-muted-foreground w-6 text-center">#{i + 1}</span>
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{edge.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${textColor} w-10 text-right`}>{pct}%</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase shrink-0">{Number(edge.current_speed_kmh || 0).toFixed(0)} km/h</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, color, label, value, sub }: { icon: any; color: string; label: string; value: string | number; sub: string }) {
  return (
    <Card className="bg-card/50 backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 text-${color}-500`} />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{label}</span>
        </div>
        <p className={`text-2xl font-bold text-${color}-500`}>{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</p>
      </CardContent>
    </Card>
  );
}
