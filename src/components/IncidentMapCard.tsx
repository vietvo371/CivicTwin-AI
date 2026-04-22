'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Navigation, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';

interface Props {
  lat: number;
  lng: number;
  highlightedEdgeIds: number[];
}

export default function IncidentMapCard({ lat, lng, highlightedEdgeIds }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const [mapLoading, setMapLoading] = useState(true);
  const highlightedSetRef = useRef(new Set<number>(highlightedEdgeIds));

  useEffect(() => {
    highlightedSetRef.current = new Set(highlightedEdgeIds);
  }, [highlightedEdgeIds]);

  useEffect(() => {
    if (!mapRef.current) return;

    let map: any;
    let cancelled = false;

    const initMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      await import('mapbox-gl/dist/mapbox-gl.css');
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

      const isDark = resolvedTheme === 'dark';
      map = new mapboxgl.Map({
        container: mapRef.current!,
        style: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 15,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
        if (cancelled) { map.remove(); return; }

        map.addSource('traffic-edges', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        map.addSource('highlighted-edges', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        // Base traffic lines — colored by congestion_level
        map.addLayer({
          id: 'traffic-edges-line',
          type: 'line',
          source: 'traffic-edges',
          paint: {
            'line-color': [
              'match', ['get', 'congestion_level'],
              'none', '#10b981',
              'light', '#eab308',
              'moderate', '#f97316',
              'heavy', '#ef4444',
              'gridlock', '#881337',
              '#94a3b8',
            ],
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2.5, 14, 3.5, 18, 5],
            'line-opacity': 0.9,
          },
        });

        // Highlighted overlay — thick orange glow
        map.addLayer({
          id: 'highlighted-edges-line',
          type: 'line',
          source: 'highlighted-edges',
          paint: {
            'line-color': '#ff6b00',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 7, 18, 10],
            'line-opacity': 1,
            'line-blur': 2,
          },
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
        });

        // Incident pulse marker
        const markerEl = document.createElement('div');
        markerEl.innerHTML = `
          <div style="position:relative;width:28px;height:28px;">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.35);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute;inset:5px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 12px rgba(239,68,68,0.7);"></div>
          </div>
          <style>@keyframes ping{75%,100%{transform:scale(2.2);opacity:0}}</style>
        `;
        new mapboxgl.Marker({ element: markerEl, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map);

        map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

        setMapLoading(false);
        mapInstanceRef.current = map;

        // Fetch GeoJSON edges after map is ready
        loadEdges();
      });

      map.on('error', () => {
        setMapLoading(false);
      });
    };

    const loadEdges = async () => {
      try {
        const res = await api.get('/edges/geojson');
        const geojson = res.data?.data ?? res.data;

        if (cancelled || !mapInstanceRef.current) return;

        const map = mapInstanceRef.current;
        if (!map.getSource('traffic-edges') || !map.getSource('highlighted-edges')) return;

        if (geojson?.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
          const allFeatures = geojson.features;
          const hSet = highlightedSetRef.current;
          const highlightedFeatures = allFeatures.filter((f: any) => hSet.has(f.id ?? f.properties?.id));

          map.getSource('traffic-edges')?.setData({ type: 'FeatureCollection', features: allFeatures });
          map.getSource('highlighted-edges')?.setData({ type: 'FeatureCollection', features: highlightedFeatures });
        }
      } catch {
        // silently ignore
      }
    };

    initMap();

    return () => {
      cancelled = true;
      map?.remove?.();
      mapInstanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme]);

  // Update highlighted edges when prop changes (after initial load)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.getSource || !map.getSource('highlighted-edges')) return;

    const src = map.getSource('traffic-edges');
    if (!src) return;

    try {
      const data = src._data ?? src._serialize?.();
      const allFeatures = data?.features ?? [];
      const hSet = highlightedSetRef.current;
      const highlighted = allFeatures.filter((f: any) => hSet.has(f.id ?? f.properties?.id));
      map.getSource('highlighted-edges')?.setData({ type: 'FeatureCollection', features: highlighted });
    } catch {
      // ignore
    }
  }, [highlightedEdgeIds]);

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="h-[300px] w-full relative">
          <div ref={mapRef} className="w-full h-full" />

          {mapLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-xl rounded-xl px-3 py-2 border shadow-lg flex items-center gap-2 text-xs font-mono z-[5]">
            <Navigation className="w-3.5 h-3.5 text-rose-500" />
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>

          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 left-3 bg-background/90 backdrop-blur-xl rounded-lg px-2.5 py-1.5 border shadow-lg flex items-center gap-1.5 text-xs font-semibold hover:bg-background transition-colors z-[5]"
          >
            <ExternalLink className="w-3 h-3" />
            Google Maps
          </a>

          {highlightedEdgeIds.length > 0 && (
            <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-xl rounded-xl px-3 py-2 border shadow-lg z-[5]">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {highlightedEdgeIds.length} đoạn bị ảnh hưởng
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-5 h-0.5 bg-orange-500 rounded" style={{ boxShadow: '0 0 4px rgba(249,115,22,0.8)' }} />
                <span className="text-[10px] text-muted-foreground">AI prediction</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
