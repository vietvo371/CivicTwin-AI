'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import {
  AlertTriangle, Clock, MapPin, ChevronRight, Siren,
  Phone, Shield, Loader2, CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const severityStyle: Record<string, string> = {
  low: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  critical: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Incident = Record<string, any>;

export default function EmergencyIncidentsPage() {
  const { t, locale } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<number, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/incidents?per_page=20');
      if (res.data?.data) {
        const filtered = res.data.data.filter(
          (i: Incident) => ['critical', 'high'].includes(i.severity) || ['open', 'investigating'].includes(i.status)
        );
        setIncidents(filtered);
      }
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleDispatch = async (id: number) => {
    setActionLoading(prev => ({ ...prev, [id]: 'dispatch' }));
    try {
      await api.patch(`/incidents/${id}`, { status: 'investigating' });
      await fetchData();
    } catch { /* ignore */ }
    setActionLoading(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleBackup = async (id: number) => {
    setActionLoading(prev => ({ ...prev, [id]: 'backup' }));
    try {
      // Assign to current user as backup coordinator
      await api.patch(`/incidents/${id}`, { status: 'investigating' });
      await fetchData();
    } catch { /* ignore */ }
    setActionLoading(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-rose-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Siren className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('emergency.activeIncidents')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading ? t('emergency.loadingIncidents') : t('emergency.incidentsCount', { n: String(incidents.length) })}
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && incidents.length === 0 && (
        <Card className="bg-card/50 backdrop-blur-xl border-border/80">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold text-muted-foreground">{t('emergency.noActiveIncidents')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('emergency.noActiveIncidentsDesc')}</p>
          </CardContent>
        </Card>
      )}

      {/* Incident Cards */}
      <div className="space-y-4">
        {incidents.map((inc) => {
          const sev = severityStyle[inc.severity] || severityStyle.medium;
          const status = inc.status || 'open';
          const isLoading = actionLoading[inc.id];
          return (
            <Card key={inc.id} className={`bg-card/50 backdrop-blur-xl border-border/80 hover:border-rose-500/30 transition-all ${inc.severity === 'critical' ? 'border-l-4 border-l-rose-500' : ''}`}>
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`text-[10px] font-bold uppercase tracking-wider border ${sev}`}>
                        {t(`enums.incidentSeverity.${inc.severity}`)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider gap-1 text-blue-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> {t(`enums.incidentStatus.${status}`)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        {t(`enums.incidentType.${inc.type}`)}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-heading font-bold">{inc.title}</h3>
                    {inc.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{inc.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {inc.source && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {t(`enums.incidentSource.${inc.source}`)}</span>}
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatTime(inc.created_at)}</span>
                    </div>
                  </div>

                  {/* Reporter & Assignee */}
                  <div className="flex gap-3 shrink-0">
                    {inc.reporter && (
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-center min-w-[100px]">
                        <p className="text-xs font-bold text-violet-400 truncate">{inc.reporter.name}</p>
                        <p className="text-[9px] font-bold text-violet-500 uppercase tracking-widest mt-1">{t('emergency.reporter')}</p>
                      </div>
                    )}
                    {inc.assignee && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center min-w-[100px]">
                        <p className="text-xs font-bold text-blue-400 truncate">{inc.assignee.name}</p>
                        <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">{t('emergency.assigned')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
                  {status !== 'investigating' && (
                    <Button
                      size="sm"
                      className="bg-rose-500 hover:bg-rose-400 text-white font-bold shadow-lg shadow-rose-500/20"
                      disabled={!!isLoading}
                      onClick={() => handleDispatch(inc.id)}
                    >
                      {isLoading === 'dispatch' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Phone className="w-4 h-4 mr-2" />}
                      {t('emergency.dispatchUnit')}
                    </Button>
                  )}
                  {status === 'investigating' && (
                    <Badge className="text-[10px] uppercase tracking-wider gap-1.5 bg-blue-500/10 text-blue-400 border-blue-500/20">
                      <CheckCircle2 className="w-3 h-3" /> {t('emergency.dispatched')}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="font-semibold border border-border"
                    disabled={!!isLoading}
                    onClick={() => handleBackup(inc.id)}
                  >
                    {isLoading === 'backup' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                    {t('emergency.requestBackup')}
                  </Button>
                  <Link
                    href={`/emergency/incidents/${inc.id}`}
                    className="ml-auto flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    {t('emergency.fullDetails')} <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
