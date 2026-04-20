'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { useTranslation, t as translate } from '@/lib/i18n';
import {
  Brain, CheckCircle, XCircle, Clock, Activity, ChevronDown,
  Cpu, Zap, Play, Loader2, AlertTriangle, MapPin, Gauge, ShieldCheck, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PredictionEdge {
  edge_id: number;
  time_horizon_minutes: number;
  predicted_density: number;
  confidence: number;
  severity: string;
  edge?: { name: string };
}

interface Prediction {
  id: number;
  incident_id: number;
  model_version: string;
  status: string;
  processing_time_ms: number;
  created_at: string;
  prediction_edges: PredictionEdge[];
}

interface ModelInfo {
  model_name: string;
  architecture?: string;
  status: string;
  framework?: string;
}

const severityConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  low: { color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: translate('enums.incidentSeverity.low') },
  medium: { color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: translate('enums.incidentSeverity.medium') },
  high: { color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: translate('enums.incidentSeverity.high') },
  critical: { color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20', label: translate('enums.incidentSeverity.critical') },
};

export default function PredictionsPage() {
  const { t, locale } = useTranslation();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    api.get('/predictions')
      .then((res) => {
        const data = res.data.data || [];
        setPredictions(data);
        if (data.length > 0) setExpandedId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    const aiUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';
    fetch(`${aiUrl}/api/model-info`)
      .then(res => res.json())
      .then(setModelInfo)
      .catch(() => setModelInfo({ model_name: 'TrafficLSTM-v2.1', status: 'fallback' }));
  }, []);

  const kpis = useMemo(() => {
    if (predictions.length === 0) return { total: 0, success: 0, avgTime: 0 };
    const completed = predictions.filter(p => p.status === 'completed');
    const avgTime = completed.length > 0
      ? Math.round(completed.reduce((sum, p) => sum + (p.processing_time_ms || 0), 0) / completed.length)
      : 0;
    return { total: predictions.length, success: completed.length, avgTime };
  }, [predictions]);

  const refreshData = async () => {
    const res = await api.get('/predictions');
    const data = res.data.data || [];
    setPredictions(data);
    return data;
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await api.post('/predictions/trigger');
      const data = await refreshData();
      if (data.length > 0) setExpandedId(data[0].id);
    } catch (e) {
      console.error('Trigger failed:', e);
    } finally {
      setTriggering(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshData();
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('op.aiPredictionsTitle')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('op.aiSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleTrigger} disabled={triggering} size="sm" className="gap-2">
            {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {t('op.runPrediction')}
          </Button>
        </div>
      </div>

      {/* ─── Stats + Model ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/60"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Brain className="w-4 h-4 text-blue-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('op.totalPredictions')}</span></div>
          <p className="text-2xl font-bold text-blue-500">{kpis.total}</p>
        </CardContent></Card>
        <Card className="bg-card/60"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('op.successRate')}</span></div>
          <p className="text-2xl font-bold text-emerald-500">{kpis.total > 0 ? Math.round((kpis.success / kpis.total) * 100) : 0}%</p>
        </CardContent></Card>
        <Card className="bg-card/60"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-amber-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('op.avgProcessingTime')}</span></div>
          <p className="text-2xl font-bold text-amber-500">{kpis.avgTime}ms</p>
        </CardContent></Card>
        {modelInfo && (
          <Card className="bg-card/60"><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Cpu className="w-4 h-4 text-purple-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI Model</span></div>
            <p className="text-sm font-bold truncate">{modelInfo.model_name}</p>
            <Badge variant={modelInfo.status === 'active' ? 'default' : 'secondary'} className="text-[9px] mt-1 gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${modelInfo.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {modelInfo.status}
            </Badge>
          </CardContent></Card>
        )}
      </div>

      {/* ─── Predictions List ─── */}
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
        <div className="space-y-3">
          {predictions.map((pred) => {
            const isExpanded = expandedId === pred.id;
            const isFailed = pred.status === 'failed';
            const edges = pred.prediction_edges || [];
            return (
              <Card key={pred.id} className={`transition-all ${isExpanded ? 'border-primary/30 shadow-lg' : 'hover:border-border'}`}>
                {/* ── Job Header (clickable) ── */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : pred.id)}
                  className="w-full p-5 flex items-center justify-between gap-4 text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isFailed ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                      {isFailed ? <XCircle className="w-5 h-5 text-red-500" /> : <Activity className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">Job #{pred.id}</span>
                        <Badge variant={isFailed ? 'destructive' : 'outline'} className="text-[10px] uppercase tracking-wider gap-1">
                          {isFailed ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3 text-emerald-500" />}
                          {t(`enums.predictionStatus.${pred.status}`)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{t('op.incidentRef', { id: String(pred.incident_id) })}</span>
                        <span>·</span>
                        <span>{pred.model_version}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pred.processing_time_ms || 0}ms</span>
                        {edges.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{edges.length} {t('op.roadsAffected')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* ── Expanded Detail ── */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {edges.length === 0 ? (
                      <div className="p-8 text-center">
                        <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-sm font-semibold mb-1">{t('op.noEdgeData')}</p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          {isFailed ? t('op.predictionFailedDesc') : t('op.noAffectedEdgesDesc')}
                        </p>
                      </div>
                    ) : (
                      <div className="p-5 space-y-3">
                        {/* Section title */}
                        <div className="flex items-center gap-2 mb-1">
                          <Gauge className="w-4 h-4 text-primary" />
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {t('op.affectedRoadsTitle')}
                          </h3>
                        </div>

                        {/* Road cards */}
                        {edges.map((pe, i) => {
                          const sev = severityConfig[pe.severity] || severityConfig.medium;
                          const density = (pe.predicted_density || 0) * 100;
                          const confidence = (pe.confidence || 0) * 100;
                          return (
                            <div key={i} className="rounded-xl border bg-muted/20 p-4">
                              {/* Road name + severity */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                                  <span className="font-bold text-sm truncate">
                                    {pe.edge?.name || `Edge #${pe.edge_id}`}
                                  </span>
                                </div>
                                <Badge className={`text-[9px] font-bold uppercase tracking-wider border ${sev.bg} ${sev.border} ${sev.color}`}>
                                  {t(`enums.incidentSeverity.${pe.severity}`)}
                                </Badge>
                              </div>

                              {/* Metrics row */}
                              <div className="grid grid-cols-3 gap-3">
                                <div className="bg-background rounded-lg p-3 border text-center">
                                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                    {t('op.timeHorizon')}
                                  </div>
                                  <div className="text-lg font-bold">+{pe.time_horizon_minutes}<span className="text-xs font-normal text-muted-foreground ml-0.5">min</span></div>
                                </div>
                                <div className="bg-background rounded-lg p-3 border text-center">
                                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                    {t('op.projectedLoad')}
                                  </div>
                                  <div className="text-lg font-bold">{density.toFixed(0)}<span className="text-xs font-normal text-muted-foreground ml-0.5">%</span></div>
                                </div>
                                <div className="bg-background rounded-lg p-3 border text-center">
                                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                    {t('op.aiConfidence')}
                                  </div>
                                  <div className="text-lg font-bold">{confidence.toFixed(0)}<span className="text-xs font-normal text-muted-foreground ml-0.5">%</span></div>
                                </div>
                              </div>

                              {/* Density progress bar */}
                              <div className="mt-3">
                                <div className="h-2 rounded-full bg-secondary border overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${
                                      density >= 80 ? 'bg-red-500' : density >= 50 ? 'bg-orange-500' : density >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(density, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
