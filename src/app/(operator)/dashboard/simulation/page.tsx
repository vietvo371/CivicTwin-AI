'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n';
import {
  FlaskConical, Play, RotateCcw, MapPin, TrendingUp,
  Clock, Layers, Zap, Gauge, ChevronDown, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

const SimulationMap = dynamic(() => import('@/components/SimulationMap'), { ssr: false });

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

function getChangeBadge(change: number) {
  if (change > 100) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  if (change > 50) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
}

export default function SimulationPage() {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const [incidentType, setIncidentType] = useState('accident');
  const [severityLevel, setSeverityLevel] = useState('high');
  const [locationArea, setLocationArea] = useState('');
  const [predictionHorizon, setPredictionHorizon] = useState('30');
  const [showAllSegments, setShowAllSegments] = useState(false);

  // Load available locations
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    api.get('/edges?per_page=50').then(res => {
      const edges = res.data?.data || [];
      setLocations(edges.map((e: any) => ({ id: e.id, name: e.name })));
      if (edges.length > 0) setLocationArea(edges[0].name);
    }).catch(() => {});
  }, []);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await api.post('/simulation/run', {
        incident_type: incidentType,
        severity_level: severityLevel,
        location_area: locationArea,
        prediction_horizon: parseInt(predictionHorizon, 10),
      });
      if (res.data?.data) {
        setResult(res.data.data);
        setShowAllSegments(false);
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setShowAllSegments(false);
  };

  const segments = result?.segments || [];
  const visibleSegments = showAllSegments ? segments : segments.slice(0, 5);
  const densityChange = result
    ? ((result.after_avg_density - result.before_avg_density) * 100).toFixed(0)
    : '0';

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500 pb-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <FlaskConical className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('op.trafficSimulation')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('op.simSubtitle')}</p>
          </div>
        </div>
        {result && (
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" /> {t('op.resetSim')}
          </Button>
        )}
      </div>

      {/* ─── Main Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Panel: Controls / Results ── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Controls */}
          <Card className="bg-card/50 backdrop-blur-xl">
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
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('op.incidentType')}</label>
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
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('op.severityLevel')}</label>
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
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('op.locationArea')}</label>
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
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('op.predHorizon')}</label>
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
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('op.running')}</>
                ) : (
                  <><Play className="w-4 h-4" /> {t('op.runSimulation')}</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* ── Result Summary ── */}
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
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background/50 p-3 rounded-lg border text-center">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">{t('op.edgesAffected')}</p>
                    <p className="text-xl font-bold text-violet-500">{segments.length}</p>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg border text-center">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">{t('op.runtimeLabel')}</p>
                    <p className="text-xl font-bold text-blue-500">{((result.duration_ms || 0) / 1000).toFixed(1)}s</p>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg border text-center">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">{t('op.avgDensityChange')}</p>
                    <p className="text-xl font-bold text-rose-500">+{densityChange}%</p>
                  </div>
                </div>

                {/* Before → After */}
                <div className="bg-background/50 p-3 rounded-lg border flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{t('op.before')}</p>
                    <p className={`text-lg font-bold ${getDensityColor(result.before_avg_density)}`}>
                      {(result.before_avg_density * 100).toFixed(0)}%
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-rose-500 mx-2 shrink-0" />
                  <div className="text-center flex-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{t('op.after')}</p>
                    <p className={`text-lg font-bold ${getDensityColor(result.after_avg_density)}`}>
                      {(result.after_avg_density * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right Panel: Map + Segments ── */}
        <div className="lg:col-span-8 space-y-4">
          {/* Simulation Map */}
          <Card className="bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardContent className="p-2">
              <div className="h-[450px] rounded-xl overflow-hidden border border-border/50">
                <SimulationMap
                  segments={segments}
                  isRunning={isRunning}
                  hasResult={!!result}
                />
              </div>
            </CardContent>
          </Card>

          {/* Segment Impact Table */}
          {result && segments.length > 0 && (
            <Card className="bg-card/40 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-orange-500" />
                  {t('op.segmentImpact')}
                  <Badge variant="secondary" className="text-[9px] ml-auto">{segments.length} {t('op.roadsAffected')}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {visibleSegments.map((seg, i) => (
                  <div key={i} className="bg-background/50 border rounded-xl p-4 hover:border-border transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="font-bold text-sm truncate">{seg.name}</span>
                      </div>
                      <Badge className={`text-[10px] font-bold uppercase border ${getChangeBadge(seg.change)}`}>
                        +{seg.change}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">{t('op.before')}</p>
                        <p className={`text-base font-bold ${getDensityColor(seg.before)}`}>
                          {(seg.before * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">{t('op.after')}</p>
                        <p className={`text-base font-bold ${getDensityColor(seg.after)}`}>
                          {(seg.after * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-secondary border overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${getBarColor(seg.after)}`} style={{ width: `${seg.after * 100}%` }} />
                    </div>
                  </div>
                ))}

                {segments.length > 5 && !showAllSegments && (
                  <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" onClick={() => setShowAllSegments(true)}>
                    <ChevronDown className="w-4 h-4" />
                    {t('op.showAll')} ({segments.length - 5} {t('op.more')})
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
