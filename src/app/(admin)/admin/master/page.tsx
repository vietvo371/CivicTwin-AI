'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import {
  Database, MapPin, Route, Radio, Loader2, Search,
  TrafficCone, Wifi, WifiOff, Camera, Gauge, CloudRain, CircleDot
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R = Record<string, any>;

const sensorTypeIcon: Record<string, React.ReactNode> = {
  camera: <Camera className="w-3.5 h-3.5 text-blue-500" />,
  loop_detector: <CircleDot className="w-3.5 h-3.5 text-cyan-500" />,
  radar: <Gauge className="w-3.5 h-3.5 text-amber-500" />,
  weather: <CloudRain className="w-3.5 h-3.5 text-violet-500" />,
};

export default function MasterDataPage() {
  const { t, locale } = useTranslation();
  const [nodes, setNodes] = useState<R[]>([]);
  const [edges, setEdges] = useState<R[]>([]);
  const [sensors, setSensors] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);

  const [nodeSearch, setNodeSearch] = useState('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState('all');
  const [edgeSearch, setEdgeSearch] = useState('');
  const [edgeStatusFilter, setEdgeStatusFilter] = useState('all');
  const [sensorSearch, setSensorSearch] = useState('');
  const [sensorStatusFilter, setSensorStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodesRes, edgesRes, sensorsRes] = await Promise.allSettled([
          api.get('/nodes'), api.get('/edges'), api.get('/sensors'),
        ]);
        if (nodesRes.status === 'fulfilled' && nodesRes.value.data?.data) setNodes(nodesRes.value.data.data);
        if (edgesRes.status === 'fulfilled' && edgesRes.value.data?.data) setEdges(edgesRes.value.data.data);
        if (sensorsRes.status === 'fulfilled' && sensorsRes.value.data?.data) setSensors(sensorsRes.value.data.data);
      } catch { /* */ } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filteredNodes = nodes.filter(n => {
    const matchSearch = !nodeSearch || n.name?.toLowerCase().includes(nodeSearch.toLowerCase());
    const matchType = nodeTypeFilter === 'all' || n.type === nodeTypeFilter;
    return matchSearch && matchType;
  });
  const filteredEdges = edges.filter(e => {
    const matchSearch = !edgeSearch || (e.name?.toLowerCase().includes(edgeSearch.toLowerCase()) || e.source_node?.toLowerCase().includes(edgeSearch.toLowerCase()) || e.target_node?.toLowerCase().includes(edgeSearch.toLowerCase()));
    const matchStatus = edgeStatusFilter === 'all' || e.congestion_level === edgeStatusFilter;
    return matchSearch && matchStatus;
  });
  const filteredSensors = sensors.filter(s => {
    const matchSearch = !sensorSearch || s.sensor_code?.toLowerCase().includes(sensorSearch.toLowerCase()) || s.edge?.name?.toLowerCase().includes(sensorSearch.toLowerCase());
    const matchStatus = sensorStatusFilter === 'all' || s.status === sensorStatusFilter;
    return matchSearch && matchStatus;
  });

  const nodeTypes = [...new Set(nodes.map(n => n.type).filter(Boolean))];
  const activeSensors = sensors.filter(s => s.status === 'active').length;

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Database className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('master.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('master.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur-xl border-border/80">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20"><MapPin className="w-5 h-5 text-cyan-500" /></div>
            <div>
              <p className="text-2xl font-heading font-black">{loading ? '...' : nodes.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('master.graphNodes')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-xl border-border/80">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"><Route className="w-5 h-5 text-amber-500" /></div>
            <div>
              <p className="text-2xl font-heading font-black">{loading ? '...' : edges.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('master.roadEdges')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-xl border-border/80">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20"><Radio className="w-5 h-5 text-violet-500" /></div>
            <div>
              <p className="text-2xl font-heading font-black">{loading ? '...' : sensors.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {t('master.iotSensors')}
                {!loading && <span className="text-emerald-500 ml-1">({activeSensors} active)</span>}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>}

      {!loading && (
        <Tabs defaultValue="nodes" className="space-y-4">
          <TabsList className="bg-card/80 border border-border">
            <TabsTrigger value="nodes" className="gap-1.5"><MapPin className="w-3.5 h-3.5" /> {t('master.nodes')} ({nodes.length})</TabsTrigger>
            <TabsTrigger value="edges" className="gap-1.5"><Route className="w-3.5 h-3.5" /> {t('master.edges')} ({edges.length})</TabsTrigger>
            <TabsTrigger value="sensors" className="gap-1.5"><Radio className="w-3.5 h-3.5" /> {t('master.sensors')} ({sensors.length})</TabsTrigger>
          </TabsList>

          {/* NODES */}
          <TabsContent value="nodes" className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t('master.searchNodes')} value={nodeSearch} onChange={(e) => setNodeSearch(e.target.value)} className="pl-10 bg-card/80" />
              </div>
              <Select value={nodeTypeFilter} onValueChange={(v) => setNodeTypeFilter(v || 'all')}>
                <SelectTrigger className="w-[180px] bg-card/80"><SelectValue placeholder={t('master.allTypes')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('master.allTypes')}</SelectItem>
                  {nodeTypes.map(ty => <SelectItem key={ty} value={ty}>{t(`enums.nodeType.${ty}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Card className="overflow-hidden bg-card/40 backdrop-blur-xl shadow-2xl">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-card/80">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[50px]">{t('common.id')}</TableHead>
                      <TableHead>{t('common.name')}</TableHead>
                      <TableHead className="text-center">{t('common.type')}</TableHead>
                      <TableHead>{t('master.zone')}</TableHead>
                      <TableHead className="text-center">{t('master.trafficLight')}</TableHead>
                      <TableHead>{t('master.coordinates')}</TableHead>
                      <TableHead className="text-center">{t('common.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNodes.map((node) => (
                      <TableRow key={node.id}>
                        <TableCell className="font-heading text-xs text-muted-foreground">#{node.id}</TableCell>
                        <TableCell className="font-semibold text-sm">{node.name}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className="text-[10px] uppercase tracking-wider">{t(`enums.nodeType.${node.type}`)}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{node.zone || '—'}</TableCell>
                        <TableCell className="text-center">
                          {node.has_traffic_light ? <TrafficCone className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {node.location ? (
                            <a href={`https://www.google.com/maps?q=${node.location.lat},${node.location.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors group/coord" title={t('common.viewOnMap')}>
                              <span className="font-mono">{Number(node.location.lat).toFixed(4)}°N, {Number(node.location.lng).toFixed(4)}°E</span>
                              <MapPin className="w-3 h-3 opacity-0 group-hover/coord:opacity-100 text-primary transition-opacity" />
                            </a>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={node.status === 'active' ? 'outline' : 'secondary'} className={`text-[10px] uppercase tracking-wider gap-1 ${node.status === 'active' ? 'text-emerald-500 border-emerald-500/20' : 'text-rose-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {t(`enums.nodeStatus.${node.status}`)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredNodes.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t('master.noNodesFound')}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* EDGES */}
          <TabsContent value="edges" className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t('master.searchEdges')} value={edgeSearch} onChange={(e) => setEdgeSearch(e.target.value)} className="pl-10 bg-card/80" />
              </div>
              <Select value={edgeStatusFilter} onValueChange={(v) => setEdgeStatusFilter(v || 'all')}>
                <SelectTrigger className="w-[180px] bg-card/80"><SelectValue placeholder={t('master.congestionFilter')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="none">{t('master.congestionLevels.none')}</SelectItem>
                  <SelectItem value="light">{t('master.congestionLevels.light')}</SelectItem>
                  <SelectItem value="moderate">{t('master.congestionLevels.moderate')}</SelectItem>
                  <SelectItem value="heavy">{t('master.congestionLevels.heavy')}</SelectItem>
                  <SelectItem value="severe">{t('master.congestionLevels.severe')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="overflow-hidden bg-card/40 backdrop-blur-xl shadow-2xl">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-card/80">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[50px]">{t('common.id')}</TableHead>
                      <TableHead>{t('master.segment')}</TableHead>
                      <TableHead className="text-center">{t('master.roadType')}</TableHead>
                      <TableHead className="text-center">{t('master.direction')}</TableHead>
                      <TableHead className="text-center">{t('master.distance')}</TableHead>
                      <TableHead className="text-center">{t('master.lanes')}</TableHead>
                      <TableHead className="text-center">{t('master.speedLimit')}</TableHead>
                      <TableHead className="text-center">{t('master.density')}</TableHead>
                      <TableHead className="text-center">{t('master.avgSpeed')}</TableHead>
                      <TableHead className="text-center">{t('master.congestion')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEdges.map((edge) => {
                      const density = edge.current_density || 0;
                      const densityColor = density > 0.7 ? 'text-rose-500' : density > 0.4 ? 'text-amber-500' : 'text-emerald-500';
                      const congColors: Record<string, string> = { none: 'text-emerald-500 border-emerald-500/20', light: 'text-cyan-500 border-cyan-500/20', moderate: 'text-amber-500 border-amber-500/20', heavy: 'text-orange-500 border-orange-500/20', severe: 'text-rose-500 border-rose-500/20' };
                      return (
                        <TableRow key={edge.id}>
                          <TableCell className="font-heading text-xs text-muted-foreground">#{edge.id}</TableCell>
                          <TableCell>
                            <p className="font-semibold text-sm">{edge.name}</p>
                            <p className="text-[11px] text-muted-foreground">{edge.source_node} → {edge.target_node}</p>
                          </TableCell>
                          <TableCell className="text-center"><Badge variant="outline" className="text-[10px] uppercase tracking-wider">{edge.road_type ? t(`enums.roadType.${edge.road_type}`) : '—'}</Badge></TableCell>
                          <TableCell className="text-center text-xs">{edge.direction === 'one_way' ? t('master.oneWay') : t('master.twoWay')}</TableCell>
                          <TableCell className="text-center font-medium text-xs">{edge.length_m ? `${(edge.length_m / 1000).toFixed(2)} km` : '—'}</TableCell>
                          <TableCell className="text-center font-heading font-bold">{edge.lanes}</TableCell>
                          <TableCell className="text-center text-xs">{edge.speed_limit_kmh} km/h</TableCell>
                          <TableCell className="text-center"><span className={`text-xs font-bold ${densityColor}`}>{(density * 100).toFixed(0)}%</span></TableCell>
                          <TableCell className="text-center text-xs font-medium">{Number(edge.current_speed_kmh || 0).toFixed(1)} km/h</TableCell>
                          <TableCell className="text-center"><Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${congColors[edge.congestion_level] || ''}`}>{t(`master.congestionLevels.${edge.congestion_level}`)}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredEdges.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">{t('master.noEdgesFound')}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* SENSORS */}
          <TabsContent value="sensors" className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t('master.searchSensors')} value={sensorSearch} onChange={(e) => setSensorSearch(e.target.value)} className="pl-10 bg-card/80" />
              </div>
              <Select value={sensorStatusFilter} onValueChange={(v) => setSensorStatusFilter(v || 'all')}>
                <SelectTrigger className="w-[180px] bg-card/80"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="active">{t('master.sensorStatus.active')}</SelectItem>
                  <SelectItem value="maintenance">{t('master.sensorStatus.maintenance')}</SelectItem>
                  <SelectItem value="offline">{t('master.sensorStatus.offline')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="overflow-hidden bg-card/40 backdrop-blur-xl shadow-2xl">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-card/80">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[50px]">{t('common.id')}</TableHead>
                      <TableHead>{t('master.sensorCode')}</TableHead>
                      <TableHead>{t('master.edgeName')}</TableHead>
                      <TableHead className="text-center">{t('common.type')}</TableHead>
                      <TableHead>{t('master.model')}</TableHead>
                      <TableHead>{t('master.firmware')}</TableHead>
                      <TableHead className="text-center">{t('common.status')}</TableHead>
                      <TableHead>{t('master.lastActive')}</TableHead>
                      <TableHead>{t('master.installedAt')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSensors.map((sensor) => {
                      const stMap: Record<string, { color: string; icon: React.ReactNode }> = {
                        active: { color: 'text-emerald-500 border-emerald-500/20', icon: <Wifi className="w-3 h-3" /> },
                        online: { color: 'text-emerald-500 border-emerald-500/20', icon: <Wifi className="w-3 h-3" /> },
                        maintenance: { color: 'text-amber-500 border-amber-500/20', icon: <WifiOff className="w-3 h-3" /> },
                        offline: { color: 'text-rose-500 border-rose-500/20', icon: <WifiOff className="w-3 h-3" /> },
                      };
                      const st = stMap[sensor.status] || stMap.offline;
                      return (
                        <TableRow key={sensor.id}>
                          <TableCell className="font-heading text-xs text-muted-foreground">#{sensor.id}</TableCell>
                          <TableCell><span className="font-semibold text-sm font-mono">{sensor.sensor_code}</span></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{sensor.edge?.name || `Edge #${sensor.edge_id}`}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider gap-1">
                              {sensorTypeIcon[sensor.type] || <Radio className="w-3.5 h-3.5" />} {t(`enums.sensorType.${sensor.type}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{sensor.model || '—'}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{sensor.firmware_version || '—'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider gap-1 ${st.color}`}>
                              {st.icon} {t(`master.sensorStatus.${sensor.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {sensor.last_active_at ? new Date(sensor.last_active_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {sensor.installed_at ? new Date(sensor.installed_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US') : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredSensors.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{t('master.noSensorsFound')}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
