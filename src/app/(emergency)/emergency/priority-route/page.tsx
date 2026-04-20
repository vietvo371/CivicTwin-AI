'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n';
import {
  Route, Navigation, Play, CheckCircle2, XCircle,
  Search, MapPin, Zap, Loader2, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

const TrafficMap = dynamic(() => import('@/components/TrafficMap'), { ssr: false });

interface GeocodeResult {
  id: string;
  name: string;
  full_name: string;
  latitude: number;
  longitude: number;
  place_type: string;
}

interface RouteSegment {
  edge_id: number;
  name: string;
  instruction: string;
  travel_time_s: number;
  current_speed_kmh: number;
  current_density: number;
  congestion_level: string;
  lanes: number;
  geometry: object;
}

interface RouteInfo {
  total_distance_km: number;
  estimated_time_min: number;
  is_blocked: boolean;
  route: RouteSegment[];
  is_fallback: boolean;
}

export default function PriorityRoutePage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [routeData, setRouteData] = useState<RouteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [vehicleType, setVehicleType] = useState('ambulance');
  const [priorityLevel, setPriorityLevel] = useState('emergency');

  // Origin/Destination — can be set by map click OR search
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number; label: string } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTarget, setSearchTarget] = useState<'origin' | 'destination' | null>(null);

  // Quick presets for Da Nang
  const presets = [
    { label: 'BV Da Nang', lat: 16.0544, lng: 108.2022 },
    { label: 'Cau Rong', lat: 16.0680, lng: 108.2214 },
    { label: 'BV Hoan My', lat: 16.0470, lng: 108.2100 },
    { label: 'BV Vinmec', lat: 16.0603, lng: 108.2102 },
    { label: 'CH Vien Nhi', lat: 16.0756, lng: 108.2233 },
  ];

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 3) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await api.get('/geocode/search', { params: { q: query } });
      setSearchResults(res.data?.data?.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectResult = (result: GeocodeResult, target: 'origin' | 'destination') => {
    const loc = { lat: result.latitude, lng: result.longitude, label: result.name };
    if (target === 'origin') { setOrigin(loc); setDestination(d => d?.lat === loc.lat && d?.lng === loc.lng ? null : d); }
    else { setDestination(loc); setOrigin(o => o?.lat === loc.lat && o?.lng === loc.lng ? null : o); }
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!origin) { setOrigin({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }); }
    else if (!destination) { setDestination({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }); }
    else { setOrigin({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }); setDestination(null); }
    toast.info(t('emergency.mapPinSet'));
  };

  const handleCalculateRoute = async () => {
    if (!origin || !destination) {
      toast.error(t('emergency.setBothLocations'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setRouteData(null);

    try {
      const res = await api.post('/emergency/priority-route', {
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        vehicle_type: vehicleType,
      });

      const data = res.data?.data;
      if (!data || data.is_blocked) {
        setError(data?.error || t('emergency.routeError'));
        toast.error(t('emergency.routeError'));
        return;
      }
      setRouteData(data);
      toast.success(data.is_fallback ? t('emergency.routeCalculatedDemo') : t('emergency.routeCalculated'));
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('emergency.routeError');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const congestionColor = (density: number) => {
    if (density > 0.7) return 'text-rose-500 bg-rose-500/10';
    if (density > 0.4) return 'text-orange-500 bg-orange-500/10';
    return 'text-emerald-500 bg-emerald-500/10';
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-4 rounded-xl border border-rose-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Route className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('emergency.priorityRoute')}</h1>
            <p className="text-xs text-muted-foreground">{t('emergency.dijkstraDesc')}</p>
          </div>
        </div>
        {routeData && !routeData.is_blocked && (
          <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] uppercase tracking-wider gap-1.5 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('emergency.routeActive')}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel */}
        <div className="lg:col-span-4 space-y-3">

          {/* Vehicle + Priority */}
          <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-border/80">
            <CardContent className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('emergency.vehicleType')}</label>
                  <Select value={vehicleType} onValueChange={(val) => { if (val) setVehicleType(val); }}>
                    <SelectTrigger className="bg-background/50 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ambulance">{t('emergency.ambulance')}</SelectItem>
                      <SelectItem value="fire_truck">{t('emergency.fireTruck')}</SelectItem>
                      <SelectItem value="police">{t('emergency.policeVehicle')}</SelectItem>
                      <SelectItem value="rescue">{t('emergency.rescueTeam')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('emergency.priorityLevel')}</label>
                  <Select value={priorityLevel} onValueChange={(val) => { if (val) setPriorityLevel(val); }}>
                    <SelectTrigger className="bg-background/50 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">{t('emergency.codeRed')}</SelectItem>
                      <SelectItem value="emergency">{t('emergency.emergencyUrgent')}</SelectItem>
                      <SelectItem value="standard">{t('emergency.standardPriority')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Origin */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {t('emergency.origin')} {origin ? '' : `— ${t('emergency.clickOrSearch')}`}
                </label>
                {origin ? (
                  <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-400 truncate">{origin.label}</p>
                      <p className="text-[10px] text-muted-foreground">{origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}</p>
                    </div>
                    <button onClick={() => setOrigin(null)} className="text-muted-foreground hover:text-rose-500">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-2 border border-dashed border-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">{t('emergency.clickOrSearchHint')}</p>
                  </div>
                )}
              </div>

              {/* Destination */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {t('emergency.destination')} {destination ? '' : `— ${t('emergency.clickOrSearch')}`}
                </label>
                {destination ? (
                  <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-rose-400 truncate">{destination.label}</p>
                      <p className="text-[10px] text-muted-foreground">{destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}</p>
                    </div>
                    <button onClick={() => setDestination(null)} className="text-muted-foreground hover:text-rose-500">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-2 border border-dashed border-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">{t('emergency.clickOrSearchHint')}</p>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    if (searchTarget) handleSearch(e.target.value);
                  }}
                  onFocus={() => setSearchTarget(origin ? 'destination' : 'origin')}
                  placeholder={t('trafficMap.searchPlaceholder')}
                  className="pl-8 bg-background/50 h-8 text-xs"
                />
                {isSearching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />}

                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {searchResults.map(r => (
                      <button
                        key={r.id}
                        onClick={() => selectResult(r, searchTarget || 'origin')}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-xs border-b border-border/50 last:border-0 transition-colors"
                      >
                        <p className="font-bold truncate">{r.name}</p>
                        <p className="text-muted-foreground truncate text-[10px]">{r.full_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick presets */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('emergency.quickSelect')}</label>
                <div className="flex flex-wrap gap-1">
                  {presets.map(p => (
                    <button
                      key={p.label}
                      onClick={() => {
                        if (!origin) setOrigin({ lat: p.lat, lng: p.lng, label: p.label });
                        else if (!destination) setDestination({ lat: p.lat, lng: p.lng, label: p.label });
                        else { setOrigin({ lat: p.lat, lng: p.lng, label: p.label }); setDestination(null); }
                      }}
                      className="px-2 py-1 text-[10px] bg-muted/50 hover:bg-muted rounded border border-border/50 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCalculateRoute}
                disabled={isLoading || !origin || !destination}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t('emergency.calculatingRoute')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" /> {t('emergency.calculateRoute')}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Route result */}
          {routeData && !routeData.is_blocked && (
            <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-emerald-500/30 animate-in slide-in-from-bottom-4">
              <CardContent className="p-3 space-y-2">
                {routeData.is_fallback && (
                  <div className="flex items-center gap-1.5 p-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-500">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {t('emergency.demoMode')}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-500">{t('emergency.routeCalculated')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background/50 p-2 rounded-lg text-center border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{t('emergency.eta')}</p>
                    <p className="text-lg font-black text-blue-500 leading-none">
                      {routeData.estimated_time_min}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{t('common.minutesShort')}</span>
                    </p>
                  </div>
                  <div className="bg-background/50 p-2 rounded-lg text-center border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{t('emergency.distance')}</p>
                    <p className="text-lg font-black text-amber-500 leading-none">
                      {routeData.total_distance_km}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{t('common.km')}</span>
                    </p>
                  </div>
                </div>

                {/* Segment list */}
                <div className="space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
                  {routeData.route.slice(0, 10).map((seg, i) => (
                    <div key={seg.edge_id} className="flex items-center gap-1.5 py-0.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${congestionColor(seg.current_density)}`}>
                        {i + 1}
                      </div>
                      <span className="flex-1 truncate text-[10px] text-muted-foreground">{seg.name}</span>
                      <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${congestionColor(seg.current_density)}`}>
                        {(seg.current_density * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="bg-card/50 border-rose-500/30">
              <CardContent className="p-3 flex items-start gap-2">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-500">{error}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Map */}
        <div className="lg:col-span-8">
          <Card className="bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden border-border/80">
            <CardContent className="p-3">
              <div className="h-[calc(100vh-260px)] rounded-xl overflow-hidden border border-border/50 relative">
                <TrafficMap onMapClick={handleMapClick} />
                {isLoading && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
                    <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                    <p className="text-sm font-bold">{t('emergency.computingRoute')}</p>
                    <p className="text-xs text-muted-foreground">{t('emergency.clearingSignals')}</p>
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
