'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import {
  ArrowLeft, AlertTriangle, MapPin, Clock, Info, User, Activity,
  CheckCircle2, AlertCircle, FileText, BrainCircuit, ShieldAlert,
  Navigation, Compass, Calendar, Timer, Image as ImageIcon,
  X, ChevronLeft, ChevronRight, Loader2, Lightbulb, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import IncidentMapCard from '@/components/IncidentMapCard';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface UserType { id: number; name: string; email: string; }

interface PredictionEdge {
  id: number;
  edge_id: number;
  predicted_density: string;
  predicted_speed: string;
  congestion_level: string;
  edge?: { id: number; name: string; road_type?: string; speed_limit_kmh?: number };
}

interface Prediction {
  id: number;
  status: string;
  confidence_score: number;
  prediction_edges: PredictionEdge[];
  created_at: string;
}

interface Recommendation {
  id: number;
  type: string;
  description: string;
  status: string;
}

interface IncidentDetail {
  id: number;
  title: string;
  description: string;
  type: string;
  severity: string;
  status: string;
  source: string;
  location_name?: string;
  created_at: string;
  resolved_at: string | null;
  reporter?: UserType;
  assignee?: UserType;
  location?: { lat: number; lng: number };
  predictions?: Prediction[];
  recommendations?: Recommendation[];
  images?: string[];
}

/* ─── Config ─────────────────────────────────────────────────────────────── */

const severityConfig: Record<string, {
  color: string; bg: string; border: string;
  badge: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  low:      { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', badge: 'secondary'    },
  medium:   { color: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   badge: 'outline'      },
  high:     { color: 'text-orange-500',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  badge: 'default'      },
  critical: { color: 'text-red-500',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     badge: 'destructive'  },
};

const statusConfig: Record<string, { icon: typeof AlertCircle; color: string; bg: string }> = {
  open:          { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10'  },
  investigating: { icon: Activity,      color: 'text-blue-500',  bg: 'bg-blue-500/10'   },
  resolved:      { icon: CheckCircle2,  color: 'text-green-500', bg: 'bg-green-500/10'  },
  closed:        { icon: CheckCircle2,  color: 'text-slate-500', bg: 'bg-slate-500/10'  },
};

const congestionColors: Record<string, { bg: string; text: string; bar: string; border: string }> = {
  low:      { bg: 'bg-emerald-500/10', text: 'text-emerald-500', bar: 'bg-emerald-500', border: 'border-emerald-500/30' },
  moderate: { bg: 'bg-amber-500/10',   text: 'text-amber-500',   bar: 'bg-amber-500',   border: 'border-amber-500/30'   },
  high:     { bg: 'bg-orange-500/10',  text: 'text-orange-500',  bar: 'bg-orange-500',  border: 'border-orange-500/30'  },
  severe:   { bg: 'bg-red-500/10',     text: 'text-red-500',     bar: 'bg-red-500',     border: 'border-red-500/30'     },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(start: string, end: string | null): string {
  const diff = Math.floor((( end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime()) / 1000);
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ─── Image Gallery ──────────────────────────────────────────────────────── */

function ImageGallery({ images }: { images: string[] }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  if (!images || images.length === 0) return null;
  const prev = () => setCurrent(c => (c - 1 + images.length) % images.length);
  const next = () => setCurrent(c => (c + 1) % images.length);

  return (
    <>
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="w-4 h-4 text-primary" />
            {images.length > 1 ? t('op.incidentImages') : t('op.incidentImage')}
            <span className="text-xs font-normal text-muted-foreground">({images.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-xl overflow-hidden bg-muted group cursor-pointer" onClick={() => setLightbox(true)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[current]} alt={`${t('op.incidentImage')} ${current + 1}`}
              className="w-full h-56 object-cover transition-opacity" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="bg-black/60 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <ImageIcon className="w-5 h-5" />
              </div>
            </div>
            {images.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); prev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors backdrop-blur-sm">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={e => { e.stopPropagation(); next(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors backdrop-blur-sm">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                  {current + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {lightbox && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors">
            <X className="w-8 h-8" />
          </button>
          {images.length > 1 && <>
            <button onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 backdrop-blur-sm">
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 backdrop-blur-sm">
              <ChevronRight className="w-8 h-8" />
            </button>
          </>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[current]} alt={`${t('op.incidentImage')} ${current + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm">
            {current + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function IncidentDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { t, locale } = useTranslation();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    api.get(`/incidents/${params.id}`)
      .then(res => setIncident(res.data.data))
      .catch(err => setError(err.response?.data?.message || t('common.error')))
      .finally(() => setLoading(false));
  }, [params, t]);

  const handleMarkResolved = async () => {
    if (!incident) return;
    setResolving(true);
    try {
      await api.patch(`/incidents/${incident.id}`, { status: 'resolved' });
      setIncident(prev => prev ? { ...prev, status: 'resolved', resolved_at: new Date().toISOString() } : prev);
    } catch (e) { console.error(e); }
    finally { setResolving(false); }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="w-full p-6 text-center mt-12">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">{error || t('common.noData')}</h2>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/dashboard/incidents')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const sevConf   = severityConfig[incident.severity]  || severityConfig.low;
  const statConf  = statusConfig[incident.status]      || statusConfig.open;
  const StatusIcon = statConf.icon;
  const hasLocation = !!(incident.location?.lat);
  const canResolve  = incident.status === 'open' || incident.status === 'investigating';

  // Collect highlighted edge IDs from predictions
  const highlightedEdgeIds: number[] = [];
  incident.predictions?.forEach(pred =>
    pred.prediction_edges?.forEach(e => {
      if (!highlightedEdgeIds.includes(e.edge_id)) highlightedEdgeIds.push(e.edge_id);
    })
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-12">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-5 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/incidents')}
            className="shrink-0 bg-background hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-heading font-bold tracking-tight truncate">{incident.title}</h1>
              <Badge variant={sevConf.badge} className="uppercase text-[10px] font-bold tracking-wider shrink-0">
                {t(`enums.incidentSeverity.${incident.severity}`)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>#{incident.id}</span>
              {incident.location_name && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{incident.location_name}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Status pill */}
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-semibold text-sm ${statConf.color} ${statConf.bg}`}>
            <StatusIcon className="w-4 h-4" />
            {t(`enums.incidentStatus.${incident.status}`)}
          </div>
          {/* Action */}
          {canResolve && (
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 shadow-sm gap-2"
              onClick={handleMarkResolved} disabled={resolving}>
              {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {t('op.markResolved')}
            </Button>
          )}
        </div>
      </div>

      {/* ─── Quick Stats ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <AlertTriangle className="w-4 h-4" />, label: t('op.incidentType'),  value: t(`enums.incidentType.${incident.type}`),   color: 'text-amber-500'  },
          { icon: <Timer         className="w-4 h-4" />, label: t('op.duration'),       value: formatDuration(incident.created_at, incident.resolved_at), color: 'text-blue-500'   },
          { icon: <Compass       className="w-4 h-4" />, label: t('op.reportSource'),   value: t(`enums.incidentSource.${incident.source}`), color: 'text-emerald-500'},
          { icon: <Calendar      className="w-4 h-4" />, label: t('op.recordedTime'),   value: formatDate(incident.created_at, locale),    color: 'text-purple-500' },
        ].map((s, i) => (
          <Card key={i} className="bg-card/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={s.color}>{s.icon}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-sm font-semibold truncate">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Main 2-col grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left col (3/5): AI content ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* AI Predictions */}
          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BrainCircuit className="w-4 h-4 text-primary" />
                {t('op.aiTrafficPrediction')}
              </CardTitle>
              <CardDescription>{t('op.aiTrafficPredictionDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {incident.predictions && incident.predictions.length > 0 ? (
                <div className="space-y-4">
                  {incident.predictions.map(pred => (
                    <div key={pred.id} className="rounded-xl border border-primary/20 overflow-hidden">
                      {/* Prediction header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-primary/[0.03] border-b border-primary/10">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-primary">
                            {t('op.evaluationSession', { id: String(pred.id) })}
                          </span>
                          <Badge variant={pred.status === 'completed' ? 'default' : 'outline'}
                            className={pred.status === 'completed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}>
                            {t(`enums.predictionStatus.${pred.status}`)}
                          </Badge>
                        </div>
                        {typeof pred.confidence_score === 'number' && pred.confidence_score > 0 && (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {t('op.confidence')}: <span className="text-primary">{(pred.confidence_score * 100).toFixed(0)}%</span>
                          </span>
                        )}
                      </div>

                      {/* Edge rows */}
                      {pred.prediction_edges && pred.prediction_edges.length > 0 ? (
                        <div className="divide-y divide-border/60">
                          <div className="px-4 py-2 bg-muted/20">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {t('op.affectedSegments', { n: String(pred.prediction_edges.length) })}
                            </p>
                          </div>
                          {pred.prediction_edges.map(edge => {
                            const level = edge.congestion_level || 'moderate';
                            const cong  = congestionColors[level] || congestionColors.moderate;
                            const density = Number(edge.predicted_density);
                            const speed   = Number(edge.predicted_speed);
                            const densityPct = isFinite(density) && density >= 0 ? Math.round(density * 100) : null;
                            const validSpeed = isFinite(speed) && speed >= 0;
                            return (
                              <div key={edge.id} className="px-4 py-3 flex items-center gap-3">
                                <div className={`w-1 h-12 rounded-full ${cong.bar} shrink-0`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-sm font-semibold truncate">
                                      {edge.edge?.name || `Edge #${edge.edge_id}`}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${cong.bg} ${cong.text} ${cong.border}`}>
                                      {t(`enums.congestionLevel.${level}`)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    {densityPct !== null && (
                                      <div className="flex items-center gap-2">
                                        <Activity className="w-3 h-3 shrink-0" />
                                        <span>{t('op.density')}:</span>
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${cong.bar}`} style={{ width: `${Math.min(densityPct, 100)}%` }} />
                                          </div>
                                          <strong className={`tabular-nums ${cong.text}`}>{densityPct}%</strong>
                                        </div>
                                      </div>
                                    )}
                                    {validSpeed && (
                                      <span className="flex items-center gap-1">
                                        <Navigation className="w-3 h-3 shrink-0" />
                                        {t('op.speed')}: <strong className="text-foreground">{speed.toFixed(0)} km/h</strong>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                          {t('op.noEdgeData')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-muted/30 border border-dashed rounded-xl flex flex-col items-center gap-3">
                  <Activity className="w-8 h-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {incident.severity === 'low' ? t('op.lowSeveritySkipped') : t('op.waitingAiAnalysis')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  {t('op.operationalRecommendations')}
                </CardTitle>
                {incident.recommendations && incident.recommendations.length > 0 && (
                  <Link href="/dashboard/recommendations"
                    className="flex items-center gap-1 text-xs text-primary hover:underline">
                    {t('op.viewInRecommendations')}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {incident.recommendations && incident.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {incident.recommendations.map(reco => (
                    <div key={reco.id} className="p-4 rounded-xl border bg-background flex flex-col gap-2 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
                      <div className="flex items-center justify-between pl-2">
                        <p className="font-semibold text-sm">{t(`enums.recommendationType.${reco.type}`)}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {t(`enums.recommendationStatus.${reco.status}`)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed pl-2">{reco.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-muted/30 border border-dashed rounded-xl">
                  <p className="text-sm text-muted-foreground italic">{t('op.noRecommendations')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="w-4 h-4 text-primary" />
                {t('op.detailedDescription')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap border border-muted min-h-[80px]">
                {incident.description || (
                  <span className="text-muted-foreground italic">{t('op.noDescription')}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right col (2/5): map + meta ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Map */}
          {hasLocation && (
            <IncidentMapCard
              lat={incident.location!.lat}
              lng={incident.location!.lng}
              highlightedEdgeIds={highlightedEdgeIds}
            />
          )}

          {/* Image Gallery */}
          {incident.images && incident.images.length > 0 && (
            <ImageGallery images={incident.images} />
          )}

          {/* Timeline */}
          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {t('op.timeline')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                {[
                  { time: incident.created_at, label: t('op.incidentReported'), active: true, color: 'bg-amber-500' },
                  ...((['investigating','resolved','closed'].includes(incident.status))
                    ? [{ time: incident.created_at, label: t('op.investigationStarted'), active: true, color: 'bg-blue-500' }]
                    : []),
                  ...(incident.resolved_at
                    ? [{ time: incident.resolved_at, label: t('op.incidentResolved'), active: true, color: 'bg-emerald-500' }]
                    : [{ time: '', label: t('op.awaitingResolution'), active: false, color: 'bg-muted' }]),
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 pb-5 last:pb-0 relative">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${step.active ? step.color : 'bg-muted border-2 border-border'}`}>
                      {step.active && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-sm font-medium ${step.active ? '' : 'text-muted-foreground'}`}>{step.label}</p>
                      {step.time && <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(step.time, locale)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Personnel */}
          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('op.relatedPersonnel')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Reporter */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('op.reporter')}</p>
                <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{incident.reporter?.name || t('op.automatedSystem')}</p>
                    <p className="text-xs text-muted-foreground truncate">{incident.reporter?.email || 'system'}</p>
                  </div>
                </div>
              </div>
              {/* Assignee */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('op.assignedHandler')}</p>
                {incident.assignee ? (
                  <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-xl border border-primary/20">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{incident.assignee.name}</p>
                      <p className="text-xs text-primary/70 truncate">{incident.assignee.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 p-3 rounded-xl border border-dashed text-center">
                    <p className="text-sm text-muted-foreground italic">{t('op.notAssigned')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
