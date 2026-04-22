'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n';
import {
  FlaskConical, Play, RotateCcw, MapPin, TrendingUp, TrendingDown,
  Clock, Layers, Zap, Gauge, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

const SimulationMap = dynamic(() => import('@/components/SimulationMap'), { ssr: false });

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface SimSegment {
  edge_id?: number;
  name: string;
  before: number;
  after: number;
  change: number;
}

interface SimulationResult {
  id: number;
  status: string;
  duration_ms: number;
  affected_edges: number;
  before_avg_density: number;
  after_avg_density: number;
  segments: SimSegment[];
}

interface EdgeOption { id: number; name: string; }

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function getDensityColor(d: number) {
  if (d < 0.3) return 'text-emerald-500';
  if (d < 0.6) return 'text-amber-500';
  if (d < 0.8) return 'text-orange-500';
  return 'text-rose-500';
}

function getBarColor(d: number) {
  if (d < 0.3) return 'bg-emerald-500';
  if (d < 0.6) return 'bg-amber-500';
  if (d < 0.8) return 'bg-orange-500';
  return 'bg-rose-500';
}

function getChangeBadgeClass(change: number) {
  if (change <= 0)  return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  if (change <= 50) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  if (change <= 100) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function SimulationPage() {
  const { t } = useTranslation();

  const [isRunning, setIsRunning]           = useState(false);
  const [result, setResult]                 = useState<SimulationResult | null>(null);
  const [incidentType, setIncidentType]     = useState('accident');
  const [severityLevel, setSeverityLevel]   = useState('high');
  const [locationArea, setLocationArea]     = useState('');
  const [predictionHorizon, setPredictionHorizon] = useState('30');
  const [showAllSegments, setShowAllSegments] = useState(false);
  const [locations, setLocations]           = useState<EdgeOption[]>([]);

  useEffect(() => {
    api.get('/edges?per_page=50').then(res => {
      const edges: EdgeOption[] = (res.data?.data || []).map((e: { id: number; name: string }) => ({ id: e.id, name: e.name }));
      setLocations(edges);
      if (edges.length > 0) setLocationArea(edges[0].name);
    }).catch(() => {});
  }, []);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    setShowAllSegments(false);
    try {
      const res = await api.post('/simulation/run', {
        incident_type:      incidentType,
        severity_level:     severityLevel,
        location_area:      locationArea,
        prediction_horizon: parseInt(predictionHorizon, 10),
      });
      if (res.data?.data) setResult(res.data.data);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => { setResult(null); setShowAllSegments(false); };

  // Sort segments worst-first by change desc
  const segments = useMemo(
    () => [...(result?.segments || [])].sort((a, b) => b.change - a.change),
    [result]
  );

  const visibleSegments = showAllSegments ? segments : segments.slice(0, 5);

  const densityDelta = result
    ? ((result.after_avg_density ?? 0) - (result.before_avg_density ?? 0)) * 100
    : 0;
  const densityDeltaStr = `${densityDelta >= 0 ? '+' : ''}${densityDelta.toFixed(0)}%`;
  const densityDeltaColor = densityDelta <= 0 ? 'text-emerald-500' : 'text-rose-500';

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-8">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <FlaskConical className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.trafficSimulation')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('op.simSubtitle')}</p>
          </div>
        </div>
        {result && (
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 shrink-0">
            <RotateCcw className="w-4 h-4" /> {t('op.resetSim')}
          </Button>
        )}
      </div>

      {/* ─── Main Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Panel: Controls + Result Summary ── */}
        <div className="lg:col-span-4 space-y-4">

          {/* Controls Card */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-500" />
                {t('op.scenarioParams')}
              </CardTitle>
              <CardDescription>{t('op.configInputs')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Incident Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('op.incidentType')}
                </label>
                <Select value={incidentType} onValueChange={v => setIncidentType(v || 'accident')}>
                  <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accident">{t('op.vehicleAccident')}</SelectItem>
                    <SelectItem value="flood">{t('op.floodWeather')}</SelectItem>
                    <SelectItem value="construction">{t('op.roadConstruction')}</SelectItem>
                    <SelectItem value="event">{t('op.publicEvent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Severity */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('op.severityLevel')}
                </label>
                <Select value={severityLevel} onValueChange={v => setSeverityLevel(v || 'high')}>
                  <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('op.lowImpact')}</SelectItem>
                    <SelectItem value="medium">{t('op.mediumImpact')}</SelectItem>
                    <SelectItem value="high">{t('op.highImpact')}</SelectItem>
                    <SelectItem value="critical">{t('op.criticalBlock')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('op.locationArea')}
                </label>
                <Select value={locationArea} onValueChange={v => setLocationArea(v || '')}>
                  <SelectTrigger className="bg-background/50">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prediction Horizon */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('op.predHorizon')}
                </label>
                <Select value={predictionHorizon} onValueChange={v => setPredictionHorizon(v || '30')}>
                  <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">{t('op.minutes15')}</SelectItem>
                    <SelectItem value="30">{t('op.minutes30')}</SelectItem>
                    <SelectItem value="60">{t('op.hour1')}</SelectItem>
                    <SelectItem value="120">{t('op.hours2')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Run Button */}
              <Button
                onClick={handleRun}
                disabled={isRunning || !locationArea}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 gap-2"
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('op.running')}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    {t('op.runSimulation')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result Summary */}
          {result && (
            <Card className="bg-card/50 backdrop-blur-xl border-violet-500/30 animate-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-500" />
                    {t('op.resultSummary')}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] uppercase text-emerald-500 border-emerald-500/30">
                    {t('op.completed')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* KPI row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background/50 p-3 rounded-lg border text-center">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">{t('op.edgesAffected')}</p>
                    <p className="text-xl font-bold text-violet-500">{segments.length}</p>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg border text-center">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">
                      <Clock className="w-3 h-3 inline mr-0.5" />{t('op.runtimeLabel')}
                    </p>
                    <p className="text-xl font-bold text-blue-500">{((result.duration_ms || 0) / 1000).toFixed(1)}s</p>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg border text-center">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">{t('op.avgDensityChange')}</p>
                    <p className={`text-xl font-bold ${densityDeltaColor}`}>{densityDeltaStr}</p>
                  </div>
                </div>

                {/* Before → After */}
                <div className="bg-background/50 p-3 rounded-lg border flex items-center justify-between gap-2">
                  <div className="text-center flex-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">{t('op.before')}</p>
                    <p className={`text-lg font-bold ${getDensityColor(result.before_avg_density)}`}>
                      {((result.before_avg_density ?? 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  {densityDelta <= 0
                    ? <TrendingDown className="w-5 h-5 text-emerald-500 shrink-0" />
                    : <TrendingUp   className="w-5 h-5 text-rose-500 shrink-0" />}
                  <div className="text-center flex-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">{t('op.after')}</p>
                    <p className={`text-lg font-bold ${getDensityColor(result.after_avg_density)}`}>
                      {((result.after_avg_density ?? 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right Panel: Map + Segments ── */}
        <div className="lg:col-span-8 space-y-4">

          {/* Map */}
          <Card className="bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden border-border/80">
            <CardContent className="p-2">
              <div className="relative h-[480px] rounded-xl overflow-hidden border border-border/50">
                <SimulationMap
                  segments={segments}
                  isRunning={isRunning}
                  hasResult={!!result}
                />
                {/* Idle overlay */}
                {!result && !isRunning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm pointer-events-none">
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <FlaskConical className="w-7 h-7 text-violet-400" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground text-center max-w-[240px]">
                      {t('op.simConfigureHint')}
                    </p>
                  </div>
                )}
                {/* Running overlay */}
                {isRunning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm pointer-events-none">
                    <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    <p className="text-sm font-semibold text-violet-400">{t('op.running')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Segment Impact */}
          {result && (
            <Card className="bg-card/40 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-500 border-border/80">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-orange-500" />
                  {t('op.segmentImpact')}
                  <Badge variant="secondary" className="text-[9px] ml-auto">
                    {segments.length} {t('op.roadsAffected')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-2">
                {segments.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center gap-2">
                    <AlertTriangle className="w-8 h-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">{t('op.simNoSegments')}</p>
                  </div>
                ) : (
                  <>
                    {visibleSegments.map((seg, i) => (
                      <div key={i} className="bg-background/50 border rounded-xl p-4 hover:border-border/80 transition-colors">
                        {/* Name + change badge */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="font-bold text-sm truncate">{seg.name}</span>
                          </div>
                          <Badge className={`text-[10px] font-bold uppercase border shrink-0 ${getChangeBadgeClass(seg.change)}`}>
                            {seg.change > 0 ? '+' : ''}{seg.change}%
                          </Badge>
                        </div>

                        {/* Before → After inline */}
                        <div className="flex items-center gap-3 mb-2 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('op.before')}</span>
                            <span className={`font-bold tabular-nums ${getDensityColor(seg.before)}`}>
                              {((seg.before ?? 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                          {seg.change <= 0
                            ? <TrendingDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            : <TrendingUp   className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('op.after')}</span>
                            <span className={`font-bold tabular-nums ${getDensityColor(seg.after)}`}>
                              {((seg.after ?? 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {/* Density bar */}
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${getBarColor(seg.after)}`}
                            style={{ width: `${Math.min((seg.after ?? 0) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Show more / less */}
                    {segments.length > 5 && (
                      <Button
                        variant="ghost" size="sm"
                        className="w-full gap-2 text-muted-foreground"
                        onClick={() => setShowAllSegments(v => !v)}
                      >
                        {showAllSegments ? (
                          <><ChevronUp className="w-4 h-4" />{t('op.showLess')}</>
                        ) : (
                          <><ChevronDown className="w-4 h-4" />{t('op.showAll')} ({segments.length - 5} {t('op.more')})</>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
