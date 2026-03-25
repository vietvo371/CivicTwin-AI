'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useEcho } from '@/hooks/useEcho';
import { AlertTriangle, AlertCircle, RefreshCw, Activity, Menu, X, Search, Navigation, Construction, CarFront, Gauge, MapPin } from 'lucide-react';
import { useTheme } from 'next-themes';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface TrafficMapProps {
  isPublic?: boolean;
  hideOverlays?: boolean;
}

export default function TrafficMap({ isPublic = false, hideOverlays = false }: TrafficMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const { t, locale } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapIncidents, setMapIncidents] = useState<any[]>([]);

  // Refs for tracking GeoJSON data
  const geojsonDataRef = useRef<any>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const endpoint = isPublic ? '/public/incidents' : '/incidents';
        const res = await api.get(`${endpoint}?per_page=20`);
        if (res.data?.data?.length > 0) {
          setMapIncidents(res.data.data);
        }
      } catch {
        // API unavailable - use fallback
        setMapIncidents([
          { id: 1, title: 'Thi cong Dien Bien Phu', lat: 16.0680, lng: 108.2122, type: 'construction', severity: 'medium' },
          { id: 2, title: 'Tai nan tren Cau Rong', lat: 16.0625, lng: 108.2295, type: 'accident', severity: 'critical' },
          { id: 3, title: 'Ket xe Cau Song Han', lat: 16.0710, lng: 108.2240, type: 'congestion', severity: 'high' },
        ]);
      }
    };
    fetchIncidents();
  }, [isPublic]);

  // Real-time: new incidents appear on map immediately
  useEcho<any>('traffic', 'IncidentCreated', (data) => {
    if (data.latitude && data.longitude) {
      setMapIncidents(prev => [data, ...prev]);
    }
  });

  // Real-time: update traffic density coloring and KPIs
  useEcho<any>('traffic', 'traffic.telemetry.updated', (data) => {
    console.log("🔥 [Socket] Nhận bản tin TrafficRealtime:", data);

    if (!data.telemetryBatch || !map.current || !geojsonDataRef.current) {
      console.warn("⚠️ [Socket] Thiếu dữ liệu hoặc map chưa sẵn sàng!", { hasBatch: !!data.telemetryBatch, hasMap: !!map.current, hasGeoRef: !!geojsonDataRef.current });
      return;
    }

    // Create a fast-lookup map for telemetry batch
    const updates = new Map(data.telemetryBatch.map((item: any) => [item.edge_id, item]));

    let congested = 0;
    let totalDen = 0;

    // Mutate the cached geoJSON features
    geojsonDataRef.current.features.forEach((feature: any) => {
      const edgeId = feature.properties.id;
      if (updates.has(edgeId)) {
        const updateInfo = updates.get(edgeId) as any;
        feature.properties.current_density = updateInfo.density;
        feature.properties.current_speed_kmh = updateInfo.speed_kmh;
      }

      const den = feature.properties.current_density || 0;
      totalDen += den;
      if (den > 0.6) congested++;
    });

    // Request map repaint if source exists
    const source = map.current.getSource('traffic-edges') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geojsonDataRef.current);
    }

    // Update UI Stats
    setCongestedCount(congested);
    const count = geojsonDataRef.current.features.length;
    setAvgDensity(count > 0 ? totalDen / count : 0);
  });

  const handleMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 16,
            essential: true
          });
        },
        (error) => {
          console.error("Error getting location: ", error);
        }
      );
    }
  };

  const flyToIncident = (lng: number, lat: number) => {
    map.current?.flyTo({ center: [lng, lat], zoom: 17, essential: true, pitch: 60 });
  };

  // Stats
  const [totalEdges, setTotalEdges] = useState(0);
  const [congestedCount, setCongestedCount] = useState(0);
  const [avgDensity, setAvgDensity] = useState(0);

  const getMapStyleUrl = () => {
    return resolvedTheme === 'dark'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/streets-v12';
  };

  const loadGeoJSON = async () => {
    try {
      const endpoint = isPublic ? '/public/edges/geojson' : '/edges/geojson';
      const res = await api.get(endpoint);
      const data = res.data;
      geojsonDataRef.current = data; // Cache for real-time mutation

      setTotalEdges(data.features.length);

      let congested = 0;
      let totalDensity = 0;
      data.features.forEach((f: any) => {
        const den = f.properties.current_density || 0;
        totalDensity += den;
        if (den > 0.6) congested++;
      });
      setCongestedCount(congested);
      setAvgDensity(data.features.length > 0 ? totalDensity / data.features.length : 0);

      const source = map.current?.getSource('traffic-edges') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(data);
      }
    } catch (err: any) {
      console.error('Failed to load map data:', err);
      setError(t('trafficMap.unableToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (map.current || !mapContainer.current) return;

    if (!mapboxgl.accessToken) {
      setError(t('trafficMap.mapboxMissing'));
      setLoading(false);
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: getMapStyleUrl(),
        center: [108.2122, 16.0680], // Da Nang City
        zoom: 14,
        pitch: 45,
        bearing: -17.6,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      const hideSymbols = () => {
        if (!map.current) return;
        const style = map.current.getStyle();
        if (style && style.layers) {
          style.layers.forEach((layer: any) => {
            if (layer.type === 'fill-extrusion' || layer.id.includes('building')) {
              map.current?.setLayoutProperty(layer.id, 'visibility', 'none');
              return;
            }
            if (layer.type === 'symbol') {
              const keepLabels = ['road', 'highway', 'street', 'path', 'bridge', 'water', 'place', 'settlement', 'country', 'state'];
              const shouldKeep = keepLabels.some(kw => layer.id.includes(kw));
              if (!shouldKeep) {
                map.current?.setLayoutProperty(layer.id, 'visibility', 'none');
              }
            }
          });
        }
      };

      map.current.on('load', () => {
        if (!map.current) return;

        const addLayers = () => {
          if (!map.current) return;
          if (!map.current.getSource('traffic-edges')) {
            map.current.addSource('traffic-edges', {
              type: 'geojson',
              data: geojsonDataRef.current || { type: 'FeatureCollection', features: [] }
            });
          }
          if (!map.current.getLayer('traffic-lines')) {
            map.current.addLayer({
              id: 'traffic-lines',
              type: 'line',
              source: 'traffic-edges',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-width': [
                  'interpolate', ['linear'], ['zoom'],
                  10, 2,
                  15, 6
                ],
                'line-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'current_density'],
                  0.0, '#10b981',
                  0.4, '#eab308',
                  0.6, '#f97316',
                  0.8, '#ef4444',
                  1.0, '#881337'
                ]
              }
            });
          }
        };

        const handleStyleLoad = () => {
          hideSymbols();
          addLayers();
        };

        hideSymbols();
        addLayers();
        map.current.on('style.load', handleStyleLoad);

        // Setup popups on hover — use pre-translated labels
        const speedLabel = t('trafficMap.speed');
        const capacityLabel = t('trafficMap.capacity');
        const unnamedLabel = t('trafficMap.unnamedStreet');

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'custom-popup'
        });

        map.current.on('mouseenter', 'traffic-lines', (e) => {
          if (!map.current || !e.features || e.features.length === 0) return;
          map.current.getCanvas().style.cursor = 'pointer';

          const coordinates = e.lngLat;
          const { id, name, current_speed_kmh, current_density } = e.features[0].properties as any;

          const html = `
            <div class="p-3 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border min-w-[200px]">
              <div class="font-bold text-sm mb-1">${name || unnamedLabel}</div>
              <div class="text-xs text-muted-foreground mb-2">ID: ${id}</div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-semibold">${speedLabel}:</span>
                <span class="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">${(current_speed_kmh || 0).toFixed(1)} km/h</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold">${capacityLabel}:</span>
                <span class="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">${((current_density || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          `;

          popup.setLngLat(coordinates).setHTML(html).addTo(map.current);
        });

        map.current.on('mouseleave', 'traffic-lines', () => {
          if (!map.current) return;
          map.current.getCanvas().style.cursor = '';
          popup.remove();
        });

        loadGeoJSON();
      });
    } catch (err: any) {
      console.error("Mapbox init error:", err);
      setError(err.message || t('trafficMap.failedInit'));
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeMap();
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Run once on mount

  // Watch for theme changes and update map style
  useEffect(() => {
    if (map.current?.isStyleLoaded()) {
      map.current.setStyle(getMapStyleUrl());
    }
  }, [resolvedTheme]);

  if (error) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-card rounded-2xl border border-border">
        <div className="text-center p-6 bg-destructive/10 rounded-xl border border-destructive/20 max-w-md">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">{t('trafficMap.connectionError')}</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const flowLevels = [
    { level: t('trafficMap.flowNone'), color: '#10b981' },
    { level: t('trafficMap.flowLight'), color: '#eab308' },
    { level: t('trafficMap.flowModerate'), color: '#f97316' },
    { level: t('trafficMap.flowHeavy'), color: '#ef4444' },
    { level: t('trafficMap.flowGridlock'), color: '#881337' },
  ];

  return (
    <div className="w-full h-[calc(100vh-8rem)] min-h-[600px] rounded-2xl overflow-hidden relative shadow-2xl border border-border ring-1 ring-white/5">
      {loading && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4 border border-border">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="font-semibold tracking-wide text-sm">{t('trafficMap.renderingEngine')}</span>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="w-full h-full" />

      {/* --- UI Controls Layer --- */}

      {!hideOverlays && (
        <>
          {/* Search Bar */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-md z-20 px-4">
            <div className="relative bg-card/90 backdrop-blur-xl border border-border shadow-2xl rounded-2xl flex items-center pr-2 pl-4 py-2 hover:border-primary/30 transition-colors focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                type="text"
                placeholder={t('trafficMap.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/70 font-medium py-1 text-foreground"
              />
            </div>
          </div>

          {/* Sidebar Toggle Button (if sidebar closed) */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-6 left-6 z-20 p-3 bg-card/90 backdrop-blur-xl border border-border rounded-xl shadow-lg hover:bg-accent focus:outline-none transition-transform hover:scale-105 active:scale-95"
            >
              <Menu className="w-6 h-6 text-foreground" />
            </button>
          )}

          {/* Collapsible Sidebar */}
          <div
            className={`absolute top-0 left-0 h-full w-80 sm:w-96 bg-card/95 backdrop-blur-2xl border-r border-border shadow-2xl z-30 transform transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            <div className="p-6 border-b border-border flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <h2 className="text-xl font-bold font-heading">{t('trafficMap.nearbyIncidents')}</h2>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {mapIncidents.map((inc: any) => {
                const incLat = inc.lat || inc.location?.lat;
                const incLng = inc.lng || inc.location?.lng;
                return (
                  <div
                    key={inc.id}
                    onClick={() => incLng && incLat && flyToIncident(incLng, incLat)}
                    className="p-4 bg-background/50 hover:bg-accent/50 border border-border rounded-xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95 group"
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {inc.type === 'construction' && <Construction className="w-5 h-5 text-amber-500" />}
                        {inc.type === 'accident' && <CarFront className="w-5 h-5 text-rose-500" />}
                        {inc.type === 'congestion' && <Gauge className="w-5 h-5 text-orange-500" />}
                        {inc.type === 'weather' && <AlertTriangle className="w-5 h-5 text-blue-500" />}
                        {!['construction', 'accident', 'congestion', 'weather'].includes(inc.type) && <AlertTriangle className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{inc.title}</h4>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {inc.severity || 'unknown'}</span>
                          <span className="text-border">•</span>
                          <span>{inc.created_at ? new Date(inc.created_at).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : inc.time || ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('trafficMap.endOfIncidents')}</p>
              </div>
            </div>
          </div>

          {/* GPS / My Location Button */}
          <button
            onClick={handleMyLocation}
            className="absolute bottom-[104px] right-6 z-20 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all outline-none hover:scale-110 active:scale-95 border-2 border-white/10"
            title={t('trafficMap.myLocation')}
          >
            <Navigation className="w-6 h-6" />
          </button>

          {/* KPI Overlay (Fade out if sidebar open) */}
          <div className={`absolute top-24 left-6 flex flex-col gap-4 z-10 pointer-events-none transition-opacity duration-300 ${isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>
            <div className="bg-card/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-border min-w-[140px] pointer-events-auto">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" /> {t('trafficMap.totalSegments')}
              </div>
              <div className="text-3xl font-heading font-black text-blue-500">{totalEdges}</div>
            </div>

            <div className="bg-card/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-border min-w-[140px] pointer-events-auto">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> {t('trafficMap.congestion')}
              </div>
              <div className="text-3xl font-heading font-black text-rose-500">
                {congestedCount} <span className="text-sm font-medium text-muted-foreground ml-1">({totalEdges ? Math.round((congestedCount / totalEdges) * 100) : 0}%)</span>
              </div>
            </div>

            <div className="bg-card/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-border min-w-[140px] pointer-events-auto">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-500" /> {t('trafficMap.avgDensity')}
              </div>
              <div className="text-3xl font-heading font-black text-amber-500">
                {(avgDensity * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </>
      )}

      {/* Legend & Controls Overlay */}
      <div className="absolute bottom-6 left-6 flex items-end gap-4 z-10 pointer-events-none">

        <div className="bg-card/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-border pointer-events-auto">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> {t('trafficMap.flowIntensity')}
          </div>
          <div className="flex items-center gap-4">
            {flowLevels.map(({ level, color }) => (
              <div key={level} className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full shadow-sm"
                  style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
                />
                <span className="text-xs font-medium text-muted-foreground capitalize tracking-wide">{level}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => { setLoading(true); loadGeoJSON(); }}
          disabled={loading}
          className="p-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-border shadow-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer text-muted-foreground hover:text-foreground pointer-events-auto"
          title={t('trafficMap.refreshData')}
        >
          <RefreshCw className={`w-5 h-5 transition-colors ${loading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>
    </div>
  );
}
