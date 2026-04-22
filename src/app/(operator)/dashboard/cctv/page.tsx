'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import {
  Camera, Maximize2, Minimize2, Wifi, WifiOff,
  MapPin, Clock, Shield, Search, RefreshCw,
  LayoutGrid, Grid2x2, Grid3x3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface SensorCamera {
  id: number;
  sensor_code: string;
  type: string;
  status: string;
  last_active_at: string | null;
  metadata: Record<string, string> | null;
  edge?: { id: number; name: string };
}

type StatusFilter = 'all' | 'active' | 'offline';
type GridCols = 2 | 3 | 4;

/* ─── Realtime Clock ─────────────────────────────────────────────────────── */

function useClock(locale: string) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString(
      locale === 'vi' ? 'vi-VN' : 'en-US',
      { hour: '2-digit', minute: '2-digit', second: '2-digit' }
    );
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, [locale]);
  return time;
}

/* ─── Scanline overlay ───────────────────────────────────────────────────── */

function ScanlineOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        zIndex: 1,
      }}
    />
  );
}

/* ─── Expanded Camera View ───────────────────────────────────────────────── */

function ExpandedView({ cam, onClose, locale }: { cam: SensorCamera; onClose: () => void; locale: string }) {
  const { t } = useTranslation();
  const clock = useClock(locale);

  const metaRows = [
    { label: t('op.sensorType'),    value: cam.type || '—' },
    { label: t('master.sensorCode'), value: cam.sensor_code },
    { label: t('op.unknownLocation').replace('Unknown', '') || t('op.locationArea'),
      value: cam.edge?.name || t('op.unknownLocation') },
    { label: t('op.lastSeen'),
      value: cam.last_active_at
        ? new Date(cam.last_active_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : '—' },
    { label: t('common.status'),
      value: cam.status === 'active' ? t('op.online') : t('op.offline') },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-xl shadow-2xl border-border/80 overflow-hidden animate-in zoom-in-95 duration-300">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Video area (2/3) */}
          <div className="lg:col-span-2 aspect-video lg:aspect-auto lg:min-h-[360px] bg-slate-950 flex items-center justify-center relative overflow-hidden">
            <ScanlineOverlay />
            {/* Noise vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.5)_100%)] pointer-events-none z-[2]" />

            <div className="text-center space-y-3 z-[3]">
              <Camera className="w-16 h-16 text-muted-foreground/20 mx-auto" />
              <div>
                <p className="text-lg font-heading font-bold text-white/80">{cam.sensor_code}</p>
                <p className="text-sm text-white/40 flex items-center justify-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {cam.edge?.name || t('op.unknownLocation')}
                </p>
              </div>
              <p className="text-[10px] text-white/20 uppercase tracking-widest">{t('op.liveFeedPlaceholder')}</p>
            </div>

            {/* LIVE badge */}
            <div className="absolute top-4 left-4 z-[3]">
              <Badge className="bg-rose-500/80 text-white border-0 text-[10px] uppercase tracking-wider gap-1.5 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-white" /> {t('op.live')}
              </Badge>
            </div>

            {/* Close */}
            <div className="absolute top-4 right-4 z-[3]">
              <button onClick={onClose} className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors">
                <Minimize2 className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Clock */}
            <div className="absolute bottom-4 left-4 z-[3] text-xs text-white/50 font-mono flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> {clock}
            </div>
          </div>

          {/* Metadata panel (1/3) */}
          <div className="p-5 border-t lg:border-t-0 lg:border-l border-border/50 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Camera Info
              </p>
              <div className="space-y-3">
                {metaRows.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-semibold mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status indicator */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold ${
              cam.status === 'active'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
            }`}>
              {cam.status === 'active'
                ? <><Wifi className="w-4 h-4" /> {t('op.online')}</>
                : <><WifiOff className="w-4 h-4" /> {t('op.offline')}</>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Camera Card ────────────────────────────────────────────────────────── */

function CameraCard({
  cam, isExpanded, onClick, locale,
}: {
  cam: SensorCamera; isExpanded: boolean; onClick: () => void; locale: string;
}) {
  const { t } = useTranslation();
  const isOnline = cam.status === 'active';
  const [showOfflineTip, setShowOfflineTip] = useState(false);

  const handleClick = () => {
    if (!isOnline) { setShowOfflineTip(true); setTimeout(() => setShowOfflineTip(false), 2000); return; }
    onClick();
  };

  return (
    <Card
      onClick={handleClick}
      className={`bg-card/40 backdrop-blur-xl shadow-lg border-border/80 overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-xl transition-all group ${
        !isOnline ? 'opacity-60' : ''
      } ${isExpanded ? 'ring-2 ring-primary' : ''}`}
    >
      <CardContent className="p-0">
        {/* Video area */}
        <div className="aspect-video bg-slate-950/80 flex items-center justify-center relative overflow-hidden">
          <ScanlineOverlay />
          <Camera className="w-10 h-10 text-muted-foreground/20 z-[2]" />

          {/* Status badge */}
          <div className="absolute top-3 left-3 z-[3]">
            {isOnline ? (
              <Badge className="bg-emerald-500/80 text-white border-0 text-[9px] uppercase tracking-wider gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {t('op.live')}
              </Badge>
            ) : (
              <Badge className="bg-rose-500/60 text-white border-0 text-[9px] uppercase tracking-wider gap-1">
                <WifiOff className="w-2.5 h-2.5" /> {t('op.offline')}
              </Badge>
            )}
          </div>

          {/* Expand icon on hover */}
          {isOnline && (
            <div className="absolute top-3 right-3 z-[3] opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>
          )}

          {/* Offline tooltip */}
          {showOfflineTip && (
            <div className="absolute inset-0 z-[4] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 bg-rose-500/90 text-white text-xs font-semibold px-3 py-2 rounded-lg">
                <WifiOff className="w-3.5 h-3.5" /> {t('op.cameraOffline')}
              </div>
            </div>
          )}

          {/* Last active timestamp */}
          {cam.last_active_at && (
            <div className="absolute bottom-2 right-3 z-[3] text-[10px] text-white/40 font-mono">
              {new Date(cam.last_active_at).toLocaleTimeString(
                locale === 'vi' ? 'vi-VN' : 'en-US',
                { hour: '2-digit', minute: '2-digit' }
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{cam.sensor_code}</p>
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                {cam.edge?.name || t('op.unknownLocation')}
              </p>
            </div>
            <Shield className={`w-4 h-4 shrink-0 ml-2 ${isOnline ? 'text-emerald-500' : 'text-muted-foreground/30'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function CCTVPage() {
  const { t, locale } = useTranslation();
  const [sensors, setSensors]     = useState<SensorCamera[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [gridCols, setGridCols]   = useState<GridCols>(3);

  const fetchSensors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/sensors');
      const all: SensorCamera[] = res.data.data || [];
      const cameras = all.filter(s => s.type === 'camera' || s.type === 'cctv');
      setSensors(cameras.length > 0 ? cameras : all);
    } catch {
      setSensors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSensors(); }, [fetchSensors]);

  const filtered = useMemo(() => {
    let list = sensors;
    if (statusFilter === 'active')  list = list.filter(s => s.status === 'active');
    if (statusFilter === 'offline') list = list.filter(s => s.status !== 'active');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.sensor_code.toLowerCase().includes(q) ||
        s.edge?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [sensors, search, statusFilter]);

  const onlineCount  = sensors.filter(s => s.status === 'active').length;
  const offlineCount = sensors.length - onlineCount;
  const expandedCam  = sensors.find(s => s.id === expanded);

  const gridClass: Record<GridCols, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all',     label: t('op.filterAllCameras'), count: sensors.length  },
    { key: 'active',  label: t('op.online'),           count: onlineCount     },
    { key: 'offline', label: t('op.offline'),          count: offlineCount    },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Camera className="w-6 h-6 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.cctvMonitoring')}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('op.camerasOnline', { online: String(onlineCount), total: String(sensors.length) })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider gap-1.5 text-emerald-500 border-emerald-500/20">
            <Wifi className="w-3 h-3" /> {onlineCount} {t('op.online')}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider gap-1.5 text-rose-500 border-rose-500/20">
            <WifiOff className="w-3 h-3" /> {offlineCount} {t('op.offline')}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchSensors} disabled={loading} className="gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ─── Toolbar: search + filter tabs + grid toggle ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('op.searchCamera')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-card/50 backdrop-blur-md h-9"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1">
          {statusTabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                statusFilter === key ? 'bg-white/20' : 'bg-border/60'
              }`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Grid size toggle */}
        <div className="flex items-center gap-1 ml-auto">
          {([2, 3, 4] as GridCols[]).map(n => {
            const Icon = n === 2 ? Grid2x2 : n === 3 ? Grid3x3 : LayoutGrid;
            return (
              <button
                key={n}
                onClick={() => setGridCols(n)}
                className={`p-1.5 rounded-lg transition-colors ${
                  gridCols === n
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
                title={`${n} columns`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Count */}
        {filtered.length !== sensors.length && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t('op.showingOf', { shown: String(filtered.length), total: String(sensors.length) })}
          </span>
        )}
      </div>

      {/* ─── Expanded View ─── */}
      {expanded !== null && expandedCam && (
        <ExpandedView cam={expandedCam} onClose={() => setExpanded(null)} locale={locale} />
      )}

      {/* ─── Camera Grid ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-card/30 border-dashed">
          <Camera className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t('op.noCamerasFound')}</p>
        </Card>
      ) : (
        <div className={`grid gap-4 ${gridClass[gridCols]}`}>
          {filtered.map(cam => (
            <CameraCard
              key={cam.id}
              cam={cam}
              isExpanded={expanded === cam.id}
              onClick={() => setExpanded(prev => prev === cam.id ? null : cam.id)}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
