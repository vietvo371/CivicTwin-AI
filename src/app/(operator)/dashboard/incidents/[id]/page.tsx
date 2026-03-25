'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { 
  ArrowLeft, AlertTriangle, MapPin, Clock, Info, User, Activity, 
  CheckCircle2, AlertCircle, FileText, BrainCircuit, ShieldAlert,
  Navigation, Compass, Calendar, Timer, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface UserType {
  id: number;
  name: string;
  email: string;
}

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
}

const severityConfig: Record<string, { color: string; bg: string; border: string; badge: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', badge: 'secondary' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', badge: 'outline' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', badge: 'default' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', badge: 'destructive' },
};

const statusConfig: Record<string, { icon: typeof AlertCircle; color: string; bg: string }> = {
  open: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  investigating: { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  resolved: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
  closed: { icon: CheckCircle2, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function formatDuration(start: string, end: string | null): string {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const diff = Math.floor((e - s) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Mini Map Component using Mapbox Static Images API
function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const loadMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      await import('mapbox-gl/dist/mapbox-gl.css');
      
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
      
      const map = new mapboxgl.Map({
        container: mapRef.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [lng, lat],
        zoom: 14,
        interactive: true,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      // Pulse marker
      const markerEl = document.createElement('div');
      markerEl.innerHTML = `
        <div style="position:relative;width:24px;height:24px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.3);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:absolute;inset:4px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 10px rgba(239,68,68,0.6);"></div>
        </div>
        <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>
      `;
      new mapboxgl.Marker({ element: markerEl }).setLngLat([lng, lat]).addTo(map);

      mapInstance.current = map;
    };

    loadMap();
    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, [lat, lng]);

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      if (!params || !params.id) return;
      try {
        setLoading(true);
        const res = await api.get(`/incidents/${params.id}`);
        setIncident(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Activity className="w-8 h-8 animate-spin" />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 text-center mt-12">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">{error || t('common.noData')}</h2>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/dashboard/incidents')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const sevConf = severityConfig[incident.severity] || severityConfig.low;
  const statConf = statusConfig[incident.status] || statusConfig.open;
  const StatusIcon = statConf.icon;
  const hasLocation = incident.location && incident.location.lat;
  const duration = formatDuration(incident.created_at, incident.resolved_at);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/incidents')} className="shrink-0 bg-background hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{incident.title}</h1>
              <Badge variant={sevConf.badge} className="uppercase text-[10px] font-bold tracking-wider">
                {t(`enums.incidentSeverity.${incident.severity}`)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <FileText className="w-4 h-4" />
              Incident #{incident.id}
              {incident.location_name && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  {incident.location_name}
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-semibold text-sm shadow-sm ${statConf.color} ${statConf.bg}`}>
          <StatusIcon className="w-5 h-5" />
          {t(`enums.incidentStatus.${incident.status}`)}
        </div>
      </div>

      {/* ─── Quick Stats Bar ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <AlertTriangle className="w-4 h-4" />, label: t('op.incidentType'), value: t(`enums.incidentType.${incident.type}`), color: 'text-amber-500' },
          { icon: <Timer className="w-4 h-4" />, label: t('op.duration'), value: duration, color: 'text-blue-500' },
          { icon: <Compass className="w-4 h-4" />, label: t('op.reportSource'), value: t(`enums.incidentSource.${incident.source}`), color: 'text-emerald-500' },
          { icon: <Calendar className="w-4 h-4" />, label: t('op.recordedTime'), value: formatDate(incident.created_at, locale), color: 'text-purple-500' },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={stat.color}>{stat.icon}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-sm font-semibold truncate">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── Left Column (3/5) ─── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Map + Location */}
          {hasLocation && (
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <div className="h-[280px] relative">
                <MiniMap lat={incident.location!.lat} lng={incident.location!.lng} />
                <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-xl rounded-xl px-3 py-2 border shadow-lg flex items-center gap-2 text-xs font-mono">
                  <Navigation className="w-3.5 h-3.5 text-rose-500" />
                  {parseFloat(incident.location!.lat.toString()).toFixed(5)}, {parseFloat(incident.location!.lng.toString()).toFixed(5)}
                </div>
                <a
                  href={`https://www.google.com/maps?q=${incident.location!.lat},${incident.location!.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 left-3 bg-background/90 backdrop-blur-xl rounded-lg px-2.5 py-1.5 border shadow-lg flex items-center gap-1.5 text-xs font-semibold hover:bg-background transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Google Maps
                </a>
              </div>
            </Card>
          )}

          {/* Description */}
          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="w-4.5 h-4.5 text-primary" />
                {t('op.detailedDescription')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap border border-muted min-h-[80px]">
                {incident.description || <span className="text-muted-foreground italic">{t('op.noDescription')}</span>}
              </div>
            </CardContent>
          </Card>

          {/* AI Predictions */}
          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BrainCircuit className="w-4.5 h-4.5 text-primary" />
                {t('op.aiTrafficPrediction')}
              </CardTitle>
              <CardDescription>{t('op.aiTrafficPredictionDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {incident.predictions && incident.predictions.length > 0 ? (
                <div className="space-y-4">
                  {incident.predictions.map(pred => {
                    const congestionColors: Record<string, { bg: string; text: string; bar: string }> = {
                      low: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', bar: 'bg-emerald-500' },
                      moderate: { bg: 'bg-amber-500/10', text: 'text-amber-600', bar: 'bg-amber-500' },
                      high: { bg: 'bg-orange-500/10', text: 'text-orange-600', bar: 'bg-orange-500' },
                      severe: { bg: 'bg-red-500/10', text: 'text-red-600', bar: 'bg-red-500' },
                    };
                    return (
                      <div key={pred.id} className="rounded-xl border border-primary/20 overflow-hidden">
                        {/* Prediction Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-primary/[0.03] border-b border-primary/10">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-primary">{t('op.evaluationSession', { id: String(pred.id) })}</span>
                            <Badge variant={pred.status === 'completed' ? 'default' : 'outline'} className={pred.status === 'completed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}>
                              {t(`enums.predictionStatus.${pred.status}`)}
                            </Badge>
                          </div>
                          {typeof pred.confidence_score === 'number' && pred.confidence_score > 0 && (
                            <span className="text-xs font-semibold text-muted-foreground">
                              {t('op.confidence')}: <span className="text-primary">{(pred.confidence_score * 100).toFixed(0)}%</span>
                            </span>
                          )}
                        </div>

                        {/* Affected Edges List */}
                        {pred.prediction_edges && pred.prediction_edges.length > 0 ? (
                          <div className="divide-y divide-border">
                            <div className="px-4 py-2.5 bg-muted/20">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {t('op.affectedSegments', { n: String(pred.prediction_edges.length) })}
                              </p>
                            </div>
                            {pred.prediction_edges.map((edge) => {
                              const congLevel = edge.congestion_level || 'moderate';
                              const cong = congestionColors[congLevel] || congestionColors.moderate;
                              const density = parseFloat(edge.predicted_density);
                              const speed = parseFloat(edge.predicted_speed);
                              return (
                                <div key={edge.id} className="px-4 py-3 flex items-center gap-3">
                                  {/* Congestion indicator bar */}
                                  <div className={`w-1 h-10 rounded-full ${cong.bar} shrink-0`} />
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-semibold">{edge.edge?.name || `Edge #${edge.edge_id}`}</span>
                                      <Badge className={`text-[9px] font-bold uppercase tracking-wider ${cong.bg} ${cong.text} border-0`}>
                                        {t(`enums.congestionLevel.${congLevel}`)}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Activity className="w-3 h-3" />
                                        {t('op.density')}: <strong className="text-foreground">{!isNaN(density) ? density.toFixed(1) : '—'}</strong>
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Navigation className="w-3 h-3" />
                                        {t('op.speed')}: <strong className="text-foreground">{!isNaN(speed) ? `${speed.toFixed(0)} km/h` : '—'}</strong>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                            {t('op.noEdgeData')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 bg-muted/30 border border-dashed rounded-xl flex flex-col items-center justify-center gap-3">
                  <Activity className="w-8 h-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {incident.severity === 'low' ? t('op.lowSeveritySkipped') : t('op.waitingAiAnalysis')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Right Column (2/5) ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-primary" />
                {t('op.timeline')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                {[
                  { time: incident.created_at, label: t('op.incidentReported'), active: true, color: 'bg-amber-500' },
                  ...(incident.status === 'investigating' || incident.status === 'resolved' || incident.status === 'closed'
                    ? [{ time: incident.created_at, label: t('op.investigationStarted'), active: true, color: 'bg-blue-500' }]
                    : []),
                  ...(incident.resolved_at
                    ? [{ time: incident.resolved_at, label: t('op.incidentResolved'), active: true, color: 'bg-green-500' }]
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

          {/* Recommendations */}
          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('op.operationalRecommendations')}</CardTitle>
            </CardHeader>
            <CardContent>
              {incident.recommendations && incident.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {incident.recommendations.map(reco => (
                    <div key={reco.id} className="p-4 rounded-xl border bg-background flex flex-col gap-2 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm leading-none pl-2">{t(`enums.recommendationType.${reco.type}`)}</p>
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
        </div>
      </div>
    </div>
  );
}
