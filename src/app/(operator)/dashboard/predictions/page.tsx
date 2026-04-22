'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import {
  Brain, CheckCircle, XCircle, Clock, Activity, ChevronDown,
  Cpu, Zap, Play, Loader2, AlertTriangle, MapPin,
  RefreshCw, TrendingUp, ArrowRight, Lightbulb, BarChart3,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface PredictionEdge {
  edge_id: number;
  time_horizon_minutes: number;
  predicted_density: number;
  confidence: number;
  severity: string;
  edge?: { name: string };
}

interface Incident {
  id: number;
  title: string;
  type: string;
  severity: string;
  location_name?: string;
}

interface Prediction {
  id: number;
  incident_id: number;
  incident?: Incident;
  model_version: string;
  status: string;
  processing_time_ms: number;
  created_at: string;
  prediction_edges: PredictionEdge[];
}

interface ModelInfo {
  model_name: string;
  status: string;
}

type StatusFilter = 'all' | 'completed' | 'failed' | 'pending';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const SEV_ORDER = ['critical', 'high', 'medium', 'low'] as const;
const HORIZONS  = [15, 30, 60];
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const SEV_STYLES = {
  low:      { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  medium:   { color: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   bar: 'bg-amber-500',   dot: 'bg-amber-500'   },
  high:     { color: 'text-orange-500',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  bar: 'bg-orange-500',  dot: 'bg-orange-500'  },
  critical: { color: 'text-red-500',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     bar: 'bg-red-500',     dot: 'bg-red-500'     },
} as const;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function worstSev(horizons: PredictionEdge[]): keyof typeof SEV_STYLES {
  for (const s of SEV_ORDER) if (horizons.some(h => h.severity === s)) return s;
  return 'low';
}

function groupByRoad(edges: PredictionEdge[]): Map<number, PredictionEdge[]> {
  const map = new Map<number, PredictionEdge[]>();
  for (const e of edges) {
    if (!map.has(e.edge_id)) map.set(e.edge_id, []);
    map.get(e.edge_id)!.push(e);
  }
  for (const [, arr] of map) arr.sort((a, b) => a.time_horizon_minutes - b.time_horizon_minutes);
  return map;
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function FilterTabs({
  active,
  onChange,
}: {
  active: StatusFilter;
  onChange: (f: StatusFilter) => void;
}) {
  const { t } = useTranslation();
  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all',       label: t('op.predFilterAll') },
    { key: 'completed', label: t('op.predFilterCompleted') },
    { key: 'pending',   label: t('op.predFilterPending') },
    { key: 'failed',    label: t('op.predFilterFailed') },
  ];
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            active === key
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function PaginationBar({
  total, page, pageSize,
  onPage, onPageSize,
}: {
  total: number; page: number; pageSize: number;
  onPage: (p: number) => void; onPageSize: (s: number) => void;
}) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const r: (number | '…')[] = [1];
    if (page > 3) r.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) r.push(i);
    if (page < totalPages - 2) r.push('…');
    r.push(totalPages);
    return r;
  }, [page, totalPages]);

  const navBtn = (disabled: boolean, onClick: () => void, icon: React.ReactNode) => (
    <button disabled={disabled} onClick={onClick}
      className="flex items-center justify-center w-8 h-8 rounded-md text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted text-muted-foreground hover:text-foreground">
      {icon}
    </button>
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/60 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <select value={pageSize} onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
          {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} {t('op.perPage')}</option>)}
        </select>
        <span>{t('op.pageOf', { current: page, total: totalPages })}</span>
      </div>
      <div className="flex items-center gap-0.5">
        {navBtn(page === 1,          () => onPage(1),           <ChevronsLeft  className="w-3.5 h-3.5" />)}
        {navBtn(page === 1,          () => onPage(page - 1),    <ChevronLeft   className="w-3.5 h-3.5" />)}
        {pages.map((p, i) => p === '…'
          ? <span key={`e${i}`} className="w-8 text-center">…</span>
          : <button key={p} onClick={() => onPage(p as number)}
              className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                p === page ? 'bg-primary text-primary-foreground shadow-sm'
                           : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
              {p}
            </button>
        )}
        {navBtn(page >= totalPages,  () => onPage(page + 1),    <ChevronRight  className="w-3.5 h-3.5" />)}
        {navBtn(page >= totalPages,  () => onPage(totalPages),  <ChevronsRight className="w-3.5 h-3.5" />)}
      </div>
    </div>
  );
}

/* ─── Prediction Card ────────────────────────────────────────────────────── */

function PredictionCard({ pred }: { pred: Prediction }) {
  const { t, locale } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const isFailed  = pred.status === 'failed';
  const edges     = pred.prediction_edges || [];
  const grouped   = groupByRoad(edges);
  const roadCount = grouped.size;

  // Overall worst severity
  const allWorst    = [...grouped.values()].map(hs => worstSev(hs));
  const overallKey  = (SEV_ORDER.find(s => allWorst.includes(s)) ?? 'low') as keyof typeof SEV_STYLES;
  const overallSev  = SEV_STYLES[overallKey];

  // i18n narrative
  const narrative = useMemo(() => {
    if (isFailed || roadCount === 0) return null;
    const allEdges = [...grouped.values()].flat();
    const peak     = allEdges.reduce((a, b) => b.predicted_density > a.predicted_density ? b : a, allEdges[0]);
    const peakRoad = peak.edge?.name ?? `#${peak.edge_id}`;
    const critN    = [...grouped.values()].filter(hs => worstSev(hs) === 'critical').length;
    const highN    = [...grouped.values()].filter(hs => worstSev(hs) === 'high').length;
    const sevStr   = critN > 0 ? t('op.predNarrativeSevCritical', { n: critN })
                   : highN > 0 ? t('op.predNarrativeSevHigh',     { n: highN })
                   :             t('op.predNarrativeSevLow');
    const incLabel = pred.incident?.title ?? `#${pred.incident_id}`;
    return t('op.predNarrativeTemplate', {
      incident: incLabel,
      roads:    roadCount,
      severity: sevStr,
      road:     peakRoad,
      pct:      Math.round(peak.predicted_density * 100),
      horizon:  peak.time_horizon_minutes,
    });
  }, [pred, grouped, roadCount, isFailed, t]);

  return (
    <Card className={`overflow-hidden transition-all ${expanded ? 'border-primary/30 shadow-xl' : 'hover:border-border/80'}`}>
      {/* ── Header row (clickable) ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full p-5 flex items-start justify-between gap-4 text-left"
      >
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isFailed ? 'bg-red-500/10' : 'bg-primary/10'}`}>
            {isFailed
              ? <XCircle className="w-5 h-5 text-red-500" />
              : <Activity className="w-5 h-5 text-primary" />}
          </div>

          <div className="min-w-0 flex-1">
            {/* Title + badges */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-sm">{t('op.predJob')} #{pred.id}</span>
              <Badge variant={isFailed ? 'destructive' : 'outline'} className="text-[10px] uppercase tracking-wider gap-1">
                {isFailed
                  ? <XCircle className="w-3 h-3" />
                  : <CheckCircle className="w-3 h-3 text-emerald-500" />}
                {t(`enums.predictionStatus.${pred.status}`)}
              </Badge>
              {!isFailed && roadCount > 0 && (
                <Badge className={`text-[10px] font-bold border ${overallSev.bg} ${overallSev.border} ${overallSev.color}`}>
                  {t(`enums.incidentSeverity.${overallKey}`)}
                </Badge>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mb-2">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span className="font-medium text-foreground">
                  {pred.incident?.title ?? `#${pred.incident_id}`}
                </span>
              </span>
              <span>·</span>
              <span className="text-purple-400 font-medium">{pred.model_version}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pred.processing_time_ms || 0}ms</span>
              {roadCount > 0 && (
                <><span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {t('op.predRoads', { n: roadCount })}
                </span></>
              )}
              <span>·</span>
              <span className="text-muted-foreground/60">
                {new Date(pred.created_at).toLocaleString(
                  locale === 'vi' ? 'vi-VN' : 'en-US',
                  { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }
                )}
              </span>
            </div>

            {/* Narrative */}
            {narrative && (
              <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-lg px-3 py-2 border border-border/50">
                {narrative}
              </p>
            )}
          </div>
        </div>

        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform mt-1 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-border">
          {grouped.size === 0 ? (
            <div className="p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold mb-1">{t('op.noEdgeData')}</p>
              <p className="text-xs text-muted-foreground">
                {isFailed ? t('op.predictionFailedDesc') : t('op.noAffectedEdgesDesc')}
              </p>
            </div>
          ) : (
            <div className="p-5 space-y-3">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t('op.predSpreadTimeline')} — {t('op.predRoads', { n: roadCount })}
                  </h3>
                </div>
                <Link href="/dashboard/recommendations" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Lightbulb className="w-3.5 h-3.5" />
                  {t('op.opDecisions')}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Horizon column headers */}
              <div className="grid grid-cols-[1fr_repeat(3,72px)] gap-2 px-1">
                <div />
                {HORIZONS.map(h => (
                  <div key={h} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t('op.predMinutes', { n: h })}
                  </div>
                ))}
              </div>

              {/* Road rows */}
              {Array.from(grouped.entries()).map(([edgeId, horizons]) => {
                const worst    = worstSev(horizons);
                const sev      = SEV_STYLES[worst];
                const roadName = horizons[0].edge?.name || `#${edgeId}`;
                const peak     = Math.max(...horizons.map(h => h.predicted_density));
                const byHz: Record<number, PredictionEdge> = {};
                for (const h of horizons) byHz[h.time_horizon_minutes] = h;

                return (
                  <div key={edgeId} className={`rounded-xl border ${sev.border} bg-muted/20 overflow-hidden`}>
                    <div className="grid grid-cols-[1fr_repeat(3,72px)] gap-2 items-center px-4 py-3">
                      {/* Road name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
                        <span className="font-semibold text-sm truncate">{roadName}</span>
                        <span className={`text-[10px] font-bold shrink-0 ${sev.color}`}>
                          {t('op.predPeak')} {Math.round(peak * 100)}%
                        </span>
                      </div>

                      {/* Density + confidence per horizon */}
                      {HORIZONS.map(hz => {
                        const h = byHz[hz];
                        if (!h) return <div key={hz} className="text-center text-xs text-muted-foreground/40">—</div>;
                        const d    = Math.round(h.predicted_density * 100);
                        const conf = Math.round(h.confidence * 100);
                        const hs   = SEV_STYLES[h.severity as keyof typeof SEV_STYLES] ?? SEV_STYLES.low;
                        return (
                          <div key={hz} className="flex flex-col items-center gap-1" title={`${t('op.predConfidence')}: ${conf}%`}>
                            <span className={`text-sm font-bold ${hs.color}`}>{d}%</span>
                            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className={`h-full rounded-full ${hs.bar}`} style={{ width: `${Math.min(d, 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground tabular-nums">{conf}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Footer note */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground/60 border-t border-border/40">
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span>{t('op.predModelNote', { model: pred.model_version, ms: pred.processing_time_ms })}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function PredictionsPage() {
  const { t } = useTranslation();

  const [predictions, setPredictions]   = useState<Prediction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [triggering, setTriggering]     = useState(false);
  const [modelInfo, setModelInfo]       = useState<ModelInfo | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(10);

  const fetchPredictions = useCallback(async () => {
    const res  = await api.get('/predictions');
    const data = res.data.data || [];
    setPredictions(data);
    return data;
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPredictions().catch(console.error).finally(() => setLoading(false));

    const aiUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';
    fetch(`${aiUrl}/api/model-info`)
      .then(r => r.json())
      .then(setModelInfo)
      .catch(() => setModelInfo({ model_name: 'TrafficSTGCN-v1.0', status: 'active' }));
  }, [fetchPredictions]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [statusFilter, pageSize]);

  const kpis = useMemo(() => {
    if (!predictions.length) return { total: 0, successRate: 0, avgTime: 0 };
    const recent    = predictions.slice(0, 10);
    const completed = recent.filter(p => p.status === 'completed');
    const avgTime   = completed.length
      ? Math.round(completed.reduce((s, p) => s + (p.processing_time_ms || 0), 0) / completed.length)
      : 0;
    return { total: predictions.length, successRate: Math.round((completed.length / recent.length) * 100), avgTime };
  }, [predictions]);

  const filtered = useMemo(
    () => statusFilter === 'all' ? predictions : predictions.filter(p => p.status === statusFilter),
    [predictions, statusFilter]
  );

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const handleRefresh = async () => {
    setLoading(true);
    try { await fetchPredictions(); } catch {} finally { setLoading(false); }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try { await api.post('/predictions/trigger'); await fetchPredictions(); }
    catch (e) { console.error(e); }
    finally { setTriggering(false); }
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.aiPredictionsTitle')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('op.predSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleTrigger} disabled={triggering} size="sm" className="gap-2">
            {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {t('op.runPrediction')}
          </Button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Brain className="w-4 h-4 text-blue-500" />,    label: t('op.predKpiTotal'),   value: kpis.total,           hint: null,                          color: 'text-blue-500' },
          { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, label: t('op.predKpiSuccess'), value: `${kpis.successRate}%`, hint: t('op.predKpiSuccessHint'), color: 'text-emerald-500' },
          { icon: <Zap className="w-4 h-4 text-amber-500" />,     label: t('op.predKpiTime'),    value: `${kpis.avgTime}ms`,  hint: t('op.predKpiTimeHint'),       color: 'text-amber-500' },
          { icon: <Cpu className="w-4 h-4 text-purple-500" />,    label: t('op.predKpiModel'),   value: modelInfo?.model_name ?? '—', hint: null,                   color: 'text-foreground', isModel: true },
        ].map(({ icon, label, value, hint, color, isModel }) => (
          <Card key={label} className="bg-card/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
              </div>
              <p className={`font-bold truncate ${isModel ? 'text-sm' : 'text-2xl'} ${color}`}>{value}</p>
              {isModel ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${modelInfo?.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-[10px] text-muted-foreground">
                    {modelInfo?.status === 'active' ? t('op.predModelActive') : (modelInfo?.status ?? '—')}
                  </span>
                </div>
              ) : hint ? (
                <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── ST-GCN explainer ── */}
      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 flex gap-3">
        <BarChart3 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          <p className="font-semibold text-purple-300">{t('op.predWhyStgcn')}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">{t('op.predWhyStgcnDesc')}</p>
        </div>
      </div>

      {/* ── List Card ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : predictions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="font-bold text-lg mb-1">{t('op.noPredictions')}</p>
            <p className="text-sm text-muted-foreground">{t('op.selectSessionHint')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/50 backdrop-blur-xl border-border/80 shadow-2xl">
          {/* Toolbar */}
          <div className="px-4 pt-4 pb-3 border-b border-border/60">
            <FilterTabs active={statusFilter} onChange={setStatusFilter} />
          </div>

          {/* Items */}
          <div className="p-4 space-y-3">
            {paginated.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">{t('op.noPredictions')}</div>
            ) : (
              paginated.map(pred => <PredictionCard key={pred.id} pred={pred} />)
            )}
          </div>

          {/* Pagination */}
          <PaginationBar
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        </Card>
      )}
    </div>
  );
}
