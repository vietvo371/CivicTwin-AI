'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import {
  Camera, Maximize2, Minimize2, Wifi, WifiOff,
  MapPin, Clock, Shield, Search, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SensorCamera {
  id: number;
  sensor_code: string;
  type: string;
  status: string;
  last_active_at: string | null;
  metadata: Record<string, string> | null;
  edge?: { id: number; name: string };
}

export default function CCTVPage() {
  const { t, locale } = useTranslation();
  const [sensors, setSensors] = useState<SensorCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const fetchSensors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sensors');
      const all: SensorCamera[] = res.data.data || [];
      // Filter camera-type sensors, or fallback to all if no camera type exists
      const cameras = all.filter(s => s.type === 'camera' || s.type === 'cctv');
      setSensors(cameras.length > 0 ? cameras : all);
    } catch {
      setSensors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSensors(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return sensors;
    const q = search.toLowerCase();
    return sensors.filter(s =>
      s.sensor_code.toLowerCase().includes(q) ||
      s.edge?.name?.toLowerCase().includes(q)
    );
  }, [sensors, search]);

  const onlineCount = sensors.filter(s => s.status === 'active').length;
  const offlineCount = sensors.length - onlineCount;
  const expandedCam = sensors.find(s => s.id === expanded);

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Camera className="w-6 h-6 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.cctvMonitoring')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('op.camerasOnline', { online: String(onlineCount), total: String(sensors.length) })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider gap-1.5 text-emerald-500 border-emerald-500/20">
            <Wifi className="w-3 h-3" /> {onlineCount} {t('op.online')}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider gap-1.5 text-rose-500 border-rose-500/20">
            <WifiOff className="w-3 h-3" /> {offlineCount} {t('op.offline')}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchSensors} disabled={loading} className="gap-2 ml-2">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('op.searchCamera')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-card/50 backdrop-blur-md"
        />
      </div>

      {/* Expanded View */}
      {expanded !== null && expandedCam && (
        <Card className="bg-card/50 backdrop-blur-xl shadow-2xl border-border/80 overflow-hidden animate-in zoom-in-95 duration-300">
          <CardContent className="p-0 relative">
            <div className="aspect-video bg-slate-950 flex items-center justify-center relative">
              <div className="text-center space-y-4">
                <Camera className="w-16 h-16 text-muted-foreground/30 mx-auto" />
                <div>
                  <p className="text-lg font-heading font-bold">{expandedCam.sensor_code}</p>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {expandedCam.edge?.name || t('op.unknownLocation')}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">{t('op.liveFeedPlaceholder')}</p>
              </div>

              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge className="bg-rose-500/80 text-white border-0 text-[10px] uppercase tracking-wider gap-1 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" /> {t('op.live')}
                </Badge>
              </div>
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setExpanded(null)}
                  className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                >
                  <Minimize2 className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 text-xs text-white/60 font-mono flex items-center gap-2">
                <Clock className="w-3 h-3" /> {new Date().toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Grid */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cam) => {
            const isOnline = cam.status === 'active';
            return (
              <Card
                key={cam.id}
                className={`bg-card/40 backdrop-blur-xl shadow-lg border-border/80 overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-xl transition-all group ${
                  !isOnline ? 'opacity-60' : ''
                } ${expanded === cam.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => isOnline && setExpanded(cam.id)}
              >
                <CardContent className="p-0">
                  <div className="aspect-video bg-slate-950/80 flex items-center justify-center relative overflow-hidden">
                    <Camera className="w-10 h-10 text-muted-foreground/20" />

                    <div className="absolute top-3 left-3">
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

                    {isOnline && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}

                    {cam.last_active_at && (
                      <div className="absolute bottom-2 right-3 text-[10px] text-white/40 font-mono">
                        {new Date(cam.last_active_at).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{cam.sensor_code}</p>
                        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" /> {cam.edge?.name || t('op.unknownLocation')}
                        </p>
                      </div>
                      <Shield className={`w-4 h-4 shrink-0 ${isOnline ? 'text-emerald-500' : 'text-muted-foreground/30'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
