'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import api from '@/lib/api';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export interface SimSegment {
  edge_id?: number;
  name: string;
  before: number;
  after: number;
  change: number;
}

interface SimulationMapProps {
  segments: SimSegment[];
  isRunning: boolean;
  hasResult: boolean;
}

function getDensityColor(d: number): string {
  if (d < 0.3) return '#10b981';
  if (d < 0.5) return '#eab308';
  if (d < 0.7) return '#f97316';
  if (d < 0.85) return '#ef4444';
  return '#881337';
}

export default function SimulationMap({ segments, isRunning, hasResult }: SimulationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const geojsonRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const getStyle = () =>
    resolvedTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';

  // Keep a ref of resolvedTheme so the style.load closure reads the latest truth
  const resolvedThemeRef = useRef(resolvedTheme);
  useEffect(() => { resolvedThemeRef.current = resolvedTheme; }, [resolvedTheme]);

  // Initialize map once
  useEffect(() => {
    if (map.current || !mapContainer.current || !mapboxgl.accessToken) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getStyle(),
      center: [108.2122, 16.068],
      zoom: 13.5,
      pitch: 30,
      bearing: -10,
      interactive: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'sim-popup' });

    map.current.on('load', async () => {
      if (!map.current) return;

      const hideBuildings = () => {
        const style = map.current?.getStyle();
        style?.layers?.forEach((layer: any) => {
          if (layer.type === 'fill-extrusion' || layer.id.includes('building')) {
            map.current?.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        });
      };

      const addLayers = () => {
        if (!map.current) return;

        if (!map.current.getSource('sim-edges')) {
          map.current.addSource('sim-edges', {
            type: 'geojson',
            data: geojsonRef.current || { type: 'FeatureCollection', features: [] },
          });
        }

        if (!map.current.getLayer('sim-bg')) {
          map.current.addLayer({
            id: 'sim-bg',
            type: 'line',
            source: 'sim-edges',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 15, 4],
              'line-color': resolvedThemeRef.current === 'dark' ? '#374151' : '#d1d5db',
              'line-opacity': 0.6,
            },
          });
        }

        if (!map.current.getLayer('sim-affected')) {
          map.current.addLayer({
            id: 'sim-affected',
            type: 'line',
            source: 'sim-edges',
            filter: ['==', ['get', 'sim_affected'], true],
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 15, 8],
              'line-color': ['get', 'sim_color'],
              'line-opacity': 0.9,
            },
          });
        }

        if (!map.current.getLayer('sim-glow')) {
          map.current.addLayer({
            id: 'sim-glow',
            type: 'line',
            source: 'sim-edges',
            filter: ['==', ['get', 'sim_affected'], true],
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-width': ['interpolate', ['linear'], ['zoom'], 10, 6, 15, 14],
              'line-color': ['get', 'sim_color'],
              'line-opacity': 0.15,
              'line-blur': 4,
            },
          });
        }
      };

      const handleStyleLoad = () => {
        hideBuildings();
        addLayers();
      };

      hideBuildings();
      addLayers();
      map.current.on('style.load', handleStyleLoad);

      // Load GeoJSON
      try {
        const res = await api.get('/edges/geojson');
        geojsonRef.current = res.data;

        // Initially all edges are dim (no simulation)
        geojsonRef.current.features.forEach((f: any) => {
          f.properties.sim_affected = false;
          f.properties.sim_color = '#6b7280';
          f.properties.sim_before = 0;
          f.properties.sim_after = 0;
          f.properties.sim_change = 0;
        });

        const source = map.current?.getSource('sim-edges') as mapboxgl.GeoJSONSource;
        source?.setData(geojsonRef.current);
      } catch (err) {
        console.error('Failed to load edges for simulation map:', err);
      } finally {
        setLoading(false);
      }

      // Hover popup for affected edges
      map.current.on('mouseenter', 'sim-affected', (e) => {
        if (!map.current || !e.features?.[0]) return;
        map.current.getCanvas().style.cursor = 'pointer';

        const props = e.features[0].properties as any;
        const beforeLabel = t('op.before');
        const afterLabel = t('op.after');
        const changeLabel = t('op.changeLabel') || 'Thay đổi';

        const html = `
          <div class="p-3 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border min-w-[220px]">
            <div class="font-bold text-sm mb-2">${props.name || 'Unknown'}</div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span class="text-muted-foreground font-semibold">${beforeLabel}:</span>
              <span class="font-mono font-bold">${(props.sim_before * 100).toFixed(0)}%</span>
              <span class="text-muted-foreground font-semibold">${afterLabel}:</span>
              <span class="font-mono font-bold" style="color:${getDensityColor(props.sim_after)}">${(props.sim_after * 100).toFixed(0)}%</span>
              <span class="text-muted-foreground font-semibold">${changeLabel}:</span>
              <span class="font-mono font-bold text-rose-500">+${props.sim_change}%</span>
            </div>
          </div>
        `;

        popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map.current);
      });

      map.current.on('mouseleave', 'sim-affected', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        popupRef.current?.remove();
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map style on theme change
  useEffect(() => {
    if (map.current?.isStyleLoaded()) {
      map.current.setStyle(getStyle());
    }
  }, [resolvedTheme]);

  // Apply simulation results to map when segments change
  useEffect(() => {
    if (!geojsonRef.current || !map.current) return;

    // Build lookup by edge_id and by name (fuzzy)
    const segByEdgeId = new Map<number, SimSegment>();
    const segByName = new Map<string, SimSegment>();
    segments.forEach((s) => {
      if (s.edge_id) segByEdgeId.set(s.edge_id, s);
      segByName.set(s.name.toLowerCase(), s);
    });

    let affectedBounds: [number, number, number, number] | null = null;

    geojsonRef.current.features.forEach((f: any) => {
      const edgeId = f.properties.id;
      const edgeName = (f.properties.name || '').toLowerCase();

      // Match by edge_id first, then by name substring
      let match = segByEdgeId.get(edgeId);
      if (!match) {
        for (const [segName, seg] of segByName) {
          if (edgeName.includes(segName) || segName.includes(edgeName)) {
            match = seg;
            break;
          }
        }
      }

      if (match && hasResult) {
        f.properties.sim_affected = true;
        f.properties.sim_color = getDensityColor(match.after);
        f.properties.sim_before = match.before;
        f.properties.sim_after = match.after;
        f.properties.sim_change = match.change;

        // Expand bounds
        if (f.geometry?.coordinates) {
          const coords = f.geometry.type === 'LineString' ? f.geometry.coordinates : f.geometry.coordinates.flat();
          coords.forEach(([lng, lat]: [number, number]) => {
            if (!affectedBounds) {
              affectedBounds = [lng, lat, lng, lat];
            } else {
              affectedBounds[0] = Math.min(affectedBounds[0], lng);
              affectedBounds[1] = Math.min(affectedBounds[1], lat);
              affectedBounds[2] = Math.max(affectedBounds[2], lng);
              affectedBounds[3] = Math.max(affectedBounds[3], lat);
            }
          });
        }
      } else {
        f.properties.sim_affected = false;
        f.properties.sim_color = '#6b7280';
        f.properties.sim_before = 0;
        f.properties.sim_after = 0;
        f.properties.sim_change = 0;
      }
    });

    const source = map.current.getSource('sim-edges') as mapboxgl.GeoJSONSource;
    source?.setData(geojsonRef.current);

    // Fly to affected area
    if (affectedBounds && hasResult) {
      map.current.fitBounds(
        [[affectedBounds[0], affectedBounds[1]], [affectedBounds[2], affectedBounds[3]]],
        { padding: 80, maxZoom: 16, duration: 1500 }
      );
    }
  }, [segments, hasResult]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden">
      {(loading || isRunning) && (
        <div className="absolute inset-0 z-20 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          {isRunning ? (
            <>
              <div className="w-14 h-14 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              <p className="font-bold text-sm">{t('op.simulatingImpact')}</p>
              <p className="text-xs text-muted-foreground">{t('op.gnnProcessing')}</p>
            </>
          ) : (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium">{t('trafficMap.renderingEngine')}</p>
            </>
          )}
        </div>
      )}

      {!hasResult && !loading && !isRunning && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-card/90 backdrop-blur-xl px-6 py-4 rounded-2xl border shadow-lg text-center">
            <p className="font-bold text-sm">{t('op.simMapWaiting')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('op.simMapHint')}</p>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="w-full h-full" />

      {/* Legend */}
      {hasResult && (
        <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur-xl p-3 rounded-xl border shadow-lg">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('op.simLegend')}</p>
          <div className="flex items-center gap-3 text-[11px]">
            {[
              { label: '<30%', color: '#10b981' },
              { label: '30-50%', color: '#eab308' },
              { label: '50-70%', color: '#f97316' },
              { label: '70-85%', color: '#ef4444' },
              { label: '>85%', color: '#881337' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full" style={{ background: color }} />
                <span className="text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
