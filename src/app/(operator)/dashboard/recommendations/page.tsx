'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import {
  Lightbulb, Check, X, Clock, Shield, Route, Bell,
  ChevronDown, ChevronRight, Brain, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PredictionEdge {
  id: number;
  edge_id: number;
  time_horizon_minutes: number;
  predicted_density: number;
  predicted_delay_s: number;
  confidence: number;
  severity: string;
  edge?: { name?: string; id: number };
}

interface Prediction {
  id: number;
  model_version?: string;
  model_type?: string;
  confidence_score?: number;
  prediction_edges?: PredictionEdge[];
}

interface Recommendation {
  id: number;
  incident_id: number;
  prediction_id?: number;
  type: string;
  description: string;
  details?: Record<string, unknown>;
  status: string;
  created_at: string;
  incident?: { id: number; title?: string; type?: string; location?: string };
  prediction?: Prediction;
}

const typeIcons: Record<string, typeof Shield> = {
  priority_route: Shield,
  reroute: Route,
  alert: Bell,
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', approved: 'default', rejected: 'destructive', executed: 'secondary',
};


const densityBar = (density: number | string) => {
  const d = parseFloat(String(density));
  const pct = Math.round(d * 100);
  const color = d > 0.8 ? 'bg-red-500' : d > 0.6 ? 'bg-orange-400' : d > 0.4 ? 'bg-yellow-400' : 'bg-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums font-semibold">{pct}%</span>
    </div>
  );
};

function AIReasoningPanel({ rec }: { rec: Recommendation }) {
  const [detail, setDetail] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = async () => {
    if (detail || loading) return;
    setLoading(true);
    try {
      const res = await api.get(`/recommendations/${rec.id}`);
      setDetail(res.data.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const toggle = () => {
    if (!expanded) load();
    setExpanded((v) => !v);
  };

  const edges = detail?.prediction?.prediction_edges ?? [];
  const at30 = edges.filter((e) => e.time_horizon_minutes === 30);
  const pool = at30.length > 0 ? at30 : edges;
  const top = [...pool]
    .sort((a, b) => parseFloat(String(b.predicted_density)) - parseFloat(String(a.predicted_density)))
    .slice(0, 4);

  const highCount = pool.filter((e) => parseFloat(String(e.predicted_density)) > 0.6).length;
  const avgConf = pool.length
    ? Math.round(pool.reduce((s, e) => s + parseFloat(String(e.confidence)), 0) / pool.length * 100)
    : null;

  return (
    <div className="mt-2">
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Brain className="w-3.5 h-3.5" />
        AI Reasoning
      </button>

      {expanded && (
        <div className="mt-2 rounded-xl border border-purple-500/20 bg-purple-950/20 p-3 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 border border-border border-t-primary rounded-full animate-spin" />
              Loading prediction data…
            </div>
          )}

          {!loading && detail && (
            <>
              {/* Summary row */}
              <div className="flex flex-wrap gap-3 text-xs">
                {detail.prediction?.model_version && (
                  <span className="flex items-center gap-1 text-white font-bold bg-purple-600/40 px-2 py-0.5 rounded-md border border-purple-400/40">
                    <TrendingUp className="w-3 h-3 text-purple-300" />
                    {detail.prediction.model_version}
                  </span>
                )}
                {avgConf !== null && (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Check className="w-3 h-3" />
                    Confidence: {avgConf}%
                  </span>
                )}
                {highCount > 0 && (
                  <span className="flex items-center gap-1 text-orange-400 font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    {highCount} đoạn đường &gt; 60% mật độ tại +30 phút
                  </span>
                )}
              </div>

              {/* Edge table */}
              {top.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/50">
                        <th className="text-left pb-1 pr-3 font-medium">Đoạn đường</th>
                        <th className="text-left pb-1 pr-3 font-medium">+30 phút</th>
                        <th className="text-left pb-1 font-medium">Mức độ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top.map((e) => (
                        <tr key={e.id} className="border-b border-border/20 last:border-0">
                          <td className="py-1 pr-3 font-medium text-foreground/80">
                            {e.edge?.name ?? `Edge #${e.edge_id}`}
                          </td>
                          <td className="py-1 pr-3">{densityBar(parseFloat(String(e.predicted_density)))}</td>
                          <td className="py-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                              e.severity === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                              e.severity === 'high'     ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                              e.severity === 'medium'   ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                                          'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}>
                              {e.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {top.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No edge-level prediction data available.</p>
              )}
            </>
          )}

          {!loading && !detail && (
            <p className="text-xs text-muted-foreground italic">Could not load prediction details.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  const { t, locale } = useTranslation();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recommendations');
      setRecs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecs(); }, []);

  const handleApprove = async (id: number) => {
    await api.patch(`/recommendations/${id}/approve`);
    fetchRecs();
  };

  const handleReject = async () => {
    if (!rejectId || !reason) return;
    await api.patch(`/recommendations/${rejectId}/reject`, { reason });
    setRejectId(null);
    setReason('');
    fetchRecs();
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Lightbulb className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.opDecisions')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('op.opDecisionsDesc')}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="p-16 text-center border-dashed">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            <span className="font-medium text-muted-foreground animate-pulse">{t('op.fetchingRecs')}</span>
          </div>
        </Card>
      ) : recs.length === 0 ? (
        <Card className="p-16 text-center border-dashed">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-2">
              <Check className="w-6 h-6 text-emerald-500 opacity-50" />
            </div>
            <p className="font-medium text-lg">{t('op.allCaughtUp')}</p>
            <p className="text-sm text-muted-foreground">{t('op.noPendingRecs')}</p>
          </div>
        </Card>
      ) : (
        <Card className="bg-card/50 backdrop-blur-xl border-border/80 shadow-2xl">
          <div className="overflow-x-auto w-full">
          <Table style={{ minWidth: '800px', width: '100%' }}>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[70px]">{t('op.id')}</TableHead>
                <TableHead className="w-[140px]">{t('op.incidentType')}</TableHead>
                <TableHead className="min-w-[280px]">{t('op.description')}</TableHead>
                <TableHead className="w-[110px]">{t('op.status')}</TableHead>
                <TableHead className="w-[160px]">{t('op.createdAt')}</TableHead>
                <TableHead className="text-right w-[160px] sticky right-0 bg-muted/50">{t('op.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recs.map((rec) => {
                const Icon = typeIcons[rec.type] || Lightbulb;
                return (
                  <TableRow key={rec.id} className="hover:bg-muted/30 transition-colors align-top">
                    <TableCell className="font-medium text-muted-foreground pt-4">#{rec.id}</TableCell>
                    <TableCell className="pt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-secondary/50 text-primary shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-xs tracking-wide uppercase">
                          {t(`enums.recommendationType.${rec.type}`)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pt-4">
                      <p className="text-sm" title={rec.description}>
                        {rec.description}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-1 uppercase tracking-widest">
                        {t('op.correlatedIncident')}: <span className="text-primary/80">
                          {rec.incident?.title ?? `#${rec.incident_id}`}
                        </span>
                      </p>
                      {rec.prediction_id && <AIReasoningPanel rec={rec} />}
                    </TableCell>
                    <TableCell className="pt-4">
                      <Badge variant={statusVariants[rec.status] || 'outline'} className="uppercase tracking-wider text-[10px]">
                        {t(`enums.recommendationStatus.${rec.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="pt-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {new Date(rec.created_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pt-4 text-right align-top sticky right-0 bg-card/95 backdrop-blur-sm">
                      {rec.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => setRejectId(rec.id)}
                          >
                            <X className="w-4 h-4 mr-1" /> {t('op.decline')}
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-500 hover:bg-emerald-600 shadow-sm shrink-0"
                            onClick={() => handleApprove(rec.id)}
                          >
                            <Check className="w-4 h-4 mr-1" /> {t('op.approve')}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic flex items-center justify-end h-8">
                          {t('op.processed')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-destructive" />
              {t('op.declineRec')}
            </DialogTitle>
            <DialogDescription>
              {t('op.declineRecDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder={t('op.reasonPlaceholder')}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="secondary" onClick={() => { setRejectId(null); setReason(''); }}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!reason}>
              {t('op.confirmDecline')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
