'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import {
  ArrowLeft, Clock, MapPin, Phone, Shield, User, Activity,
  AlertTriangle, Loader2, CheckCircle2, XCircle, Eye, Navigation,
  Zap, TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IncidentDetail = Record<string, any>;

const SEV_THEME: Record<string, { badge: string; marker: string; gradient: string }> = {
  low:      { badge: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', marker: '#10b981', gradient: 'from-emerald-900/90 via-emerald-900/50 to-transparent' },
  medium:   { badge: 'text-amber-400 bg-amber-500/15 border-amber-500/30',       marker: '#f59e0b', gradient: 'from-amber-900/90 via-amber-900/50 to-transparent'   },
  high:     { badge: 'text-orange-400 bg-orange-500/15 border-orange-500/30',     marker: '#f97316', gradient: 'from-orange-900/90 via-orange-900/50 to-transparent' },
  critical: { badge: 'text-rose-400 bg-rose-500/15 border-rose-500/30',           marker: '#f43f5e', gradient: 'from-rose-900/90 via-rose-900/50 to-transparent'    },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  open: <AlertTriangle className="w-4 h-4" />,
  investigating: <Eye className="w-4 h-4" />,
  resolved: <CheckCircle2 className="w-4 h-4" />,
  closed: <XCircle className="w-4 h-4" />,
};

export default function IncidentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, locale } = useTranslation();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  const [data, setData] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  // Fetch detail
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await api.get(`/incidents/${id}`);
        setData(res.data?.data || res.data);
      } catch {
        router.push('/emergency/incidents');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  // Mapbox
  useEffect(() => {
    if (!data || !mapRef.current) return;
    
    let lng = 108.2208;
    let lat = 16.0678;
    if (data.location?.lng && data.location?.lat) {
      lng = Number(data.location.lng);
      lat = Number(data.location.lat);
    }

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    mapInstance.current = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: 15,
      interactive: true,
      attributionControl: false,
    });

    mapInstance.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const theme = SEV_THEME[data.severity] || SEV_THEME.medium;
    new mapboxgl.Marker({ color: theme.marker })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${data.title}</strong>`))
      .addTo(mapInstance.current);

    const ro = new ResizeObserver(() => mapInstance.current?.resize());
    ro.observe(mapRef.current);

    return () => {
      ro.disconnect();
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [data]);

  const handleAction = async (action: string, payload: Record<string, string>) => {
    if (!data) return;
    setActionLoading(action);
    try {
      await api.patch(`/incidents/${data.id}`, payload);
      const res = await api.get(`/incidents/${data.id}`);
      setData(res.data?.data || res.data);
    } catch { /* ignore */ }
    setActionLoading('');
  };

  const fmt = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const theme = SEV_THEME[data.severity] || SEV_THEME.medium;
  const predictions = data.predictions || [];
  const recommendations = data.recommendations || [];

  return (
    <div className="animate-in fade-in duration-500">
      {/* ─── HERO MAP SECTION ─── */}
      <div className="relative w-full h-[45vh] min-h-[350px] -mt-6 -mx-6 bg-muted overflow-hidden" style={{ width: 'calc(100% + 3rem)' }}>
        <div ref={mapRef} className="absolute inset-0 z-0 w-full h-full" />

        {/* Gradient overlay bottom */}
        <div className={`absolute inset-0 z-10 bg-gradient-to-t ${theme.gradient} pointer-events-none`} />

        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-6 left-6 z-20 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/10"
          onClick={() => router.push('/emergency/incidents')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> {t('common.back')}
        </Button>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge className={`text-[10px] font-extrabold uppercase tracking-widest border ${theme.badge} shadow-lg`}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {t(`enums.incidentSeverity.${data.severity}`)}
              </Badge>
              <Badge className="text-[10px] uppercase tracking-widest gap-1.5 bg-white/10 text-white border-white/20 backdrop-blur-md shadow-lg">
                {STATUS_ICON[data.status] || STATUS_ICON.open}
                {t(`enums.incidentStatus.${data.status}`)}
              </Badge>
              <Badge className="text-[10px] uppercase tracking-widest bg-white/10 text-white border-white/20 backdrop-blur-md shadow-lg">
                {t(`enums.incidentType.${data.type}`)}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-heading font-black text-white drop-shadow-lg leading-tight tracking-tight max-w-3xl">
              {data.title}
            </h1>

            <div className="flex items-center gap-5 mt-4 text-white/70 text-sm flex-wrap">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {fmt(data.created_at)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Đà Nẵng</span>
              {data.source && <span className="flex items-center gap-1.5"><Navigation className="w-4 h-4" /> {t(`enums.incidentSource.${data.source}`)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ─── CONTENT GRID ─── */}
      <div className="max-w-[1400px] mx-auto mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT COLUMN (3/5) */}
        <div className="lg:col-span-3 space-y-6">

          {/* Description & Images */}
          {(() => {
            let meta = data.metadata;
            if (typeof meta === 'string') {
              try { meta = JSON.parse(meta); } catch(e) {}
            }
            const hasImages = meta?.images?.length > 0 || meta?.image_url || meta?.photo;
            
            if (!data.description && !hasImages) return null;

            return (
              <Card className="bg-card/50 backdrop-blur-xl border-border/80">
                <CardContent className="p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{t('emergency.details')}</h3>
                  {data.description && <p className="text-sm leading-relaxed text-foreground/90">{data.description}</p>}
                  
                  {/* Citizen Evidence Images */}
                  {(() => {
                    let imgs: string[] = [];
                    if (Array.isArray(meta?.images)) imgs = meta.images;
                    else if (typeof meta?.image_url === 'string') imgs = [meta.image_url];
                    else if (typeof meta?.photo === 'string') imgs = [meta.photo];
                    
                    if (imgs.length === 0) return null;

                    return (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {imgs.map((src, idx) => (
                          <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-border/50 group bg-black/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="Evidence" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })()}

          {/* People */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-card/50 backdrop-blur-xl border-border/80 border-l-4 border-l-violet-500">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('emergency.reporter')}</p>
                  <p className="text-sm font-semibold truncate">{data.reporter?.name || t('common.unknown')}</p>
                  <p className="text-xs text-muted-foreground truncate">{data.reporter?.phone || data.reporter?.email || ''}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-xl border-border/80 border-l-4 border-l-blue-500">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('emergency.assigned')}</p>
                  <p className="text-sm font-semibold truncate">{data.assignee?.name || t('emergency.unassigned')}</p>
                  {data.assignee && <p className="text-xs text-muted-foreground">{t('emergency.dispatcher')}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> {t('emergency.timeline')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="relative border-l-2 border-border/50 pl-6 space-y-5">
                <TimelineItem label={t('emergency.reported')} time={fmt(data.created_at)} color="bg-rose-500" />
                {data.updated_at !== data.created_at && (
                  <TimelineItem label={t('emergency.lastUpdated')} time={fmt(data.updated_at)} color="bg-blue-500" />
                )}
                {data.resolved_at && (
                  <TimelineItem label={t('emergency.resolved')} time={fmt(data.resolved_at)} color="bg-emerald-500" />
                )}
              </div>
            </CardContent>
          </Card>


        </div>

        {/* RIGHT COLUMN (2/5) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Actions */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" /> {t('emergency.quickActions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-3">
              {data.status !== 'investigating' && data.status !== 'resolved' && (
                <Button
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold h-11 shadow-lg shadow-rose-500/20"
                  disabled={!!actionLoading}
                  onClick={() => handleAction('dispatch', { status: 'investigating' })}
                >
                  {actionLoading === 'dispatch' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Phone className="w-5 h-5 mr-2" />}
                  {t('emergency.dispatchUnit')}
                </Button>
              )}
              {data.status === 'investigating' && (
                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11"
                  disabled={!!actionLoading}
                  onClick={() => handleAction('resolve', { status: 'resolved' })}
                >
                  {actionLoading === 'resolve' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  {t('emergency.markResolved')}
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full font-semibold h-11 border border-border"
                disabled={!!actionLoading}
                onClick={() => handleAction('backup', { status: 'investigating' })}
              >
                {actionLoading === 'backup' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Shield className="w-5 h-5 mr-2" />}
                {t('emergency.requestBackup')}
              </Button>
            </CardContent>
          </Card>



          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="bg-card/50 backdrop-blur-xl border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t('emergency.recommendations')} ({recommendations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-3">
                {recommendations.map((r: IncidentDetail) => (
                  <div key={r.id} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-sm font-semibold">{r.action_type}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Timeline item ── */
function TimelineItem({ label, time, color }: { label: string; time: string; color: string }) {
  return (
    <div className="relative">
      <div className={`absolute -left-[calc(0.75rem+5px)] top-1 w-2.5 h-2.5 rounded-full ${color} ring-4 ring-background`} />
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{time}</p>
    </div>
  );
}
