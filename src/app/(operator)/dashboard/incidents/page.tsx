'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Plus, Eye, Clock, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface Incident {
  id: number;
  title: string;
  type: string;
  severity: string;
  status: string;
  source: string;
  created_at: string;
}

const severityVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: 'secondary', medium: 'outline', high: 'default', critical: 'destructive',
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: 'default', investigating: 'secondary', resolved: 'outline', closed: 'outline',
};

export default function IncidentsPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', severity: 'all' });
  const [createOpen, setCreateOpen] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status !== 'all') params.set('status', filter.status);
      if (filter.severity !== 'all') params.set('severity', filter.severity);
      const res = await api.get(`/incidents?${params}`);
      setIncidents(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, [filter]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api.post('/incidents', {
        title: form.get('title'),
        type: form.get('type'),
        severity: form.get('severity'),
        source: 'operator',
        description: form.get('description'),
      });
      setCreateOpen(false);
      fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.trafficIncidents')}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t('op.activeIncidentsCount', { n: String(incidents.length) })}
            </p>
          </div>
        </div>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> {t('op.reportIncident')}
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                {t('op.reportNewIncident')}
              </DialogTitle>
              <DialogDescription>
                {t('op.reportNewDesc')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('op.titleLabel')}</label>
                <Input name="title" required placeholder={t('op.titlePlaceholder')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('op.incidentType')}</label>
                  <select name="type" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="accident">{t('enums.incidentType.accident')}</option>
                    <option value="congestion">{t('enums.incidentType.congestion')}</option>
                    <option value="construction">{t('enums.incidentType.construction')}</option>
                    <option value="weather">{t('enums.incidentType.weather')}</option>
                    <option value="other">{t('enums.incidentType.other')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('common.severity')}</label>
                  <select name="severity" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="low">{t('enums.incidentSeverity.low')}</option>
                    <option value="medium">{t('enums.incidentSeverity.medium')}</option>
                    <option value="high">{t('enums.incidentSeverity.high')}</option>
                    <option value="critical">{t('enums.incidentSeverity.critical')}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('op.detailsLabel')}</label>
                <textarea name="description" rows={3} required className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none" placeholder={t('op.detailsPlaceholder')} />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit">{t('op.submitReport')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filter.status} onValueChange={(val) => setFilter({ ...filter, status: val || 'all' })}>
          <SelectTrigger className="w-[180px] bg-card/80 backdrop-blur-md">
            <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-muted-foreground" /><SelectValue placeholder={t('common.status')} /></div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('op.anyStatus')}</SelectItem>
            <SelectItem value="open">{t('enums.incidentStatus.open')}</SelectItem>
            <SelectItem value="investigating">{t('enums.incidentStatus.investigating')}</SelectItem>
            <SelectItem value="resolved">{t('enums.incidentStatus.resolved')}</SelectItem>
            <SelectItem value="closed">{t('enums.incidentStatus.closed')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filter.severity} onValueChange={(val) => setFilter({ ...filter, severity: val || 'all' })}>
          <SelectTrigger className="w-[180px] bg-card/80 backdrop-blur-md">
            <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-muted-foreground" /><SelectValue placeholder={t('common.severity')} /></div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('op.anySeverity')}</SelectItem>
            <SelectItem value="low">{t('enums.incidentSeverity.low')}</SelectItem>
            <SelectItem value="medium">{t('enums.incidentSeverity.medium')}</SelectItem>
            <SelectItem value="high">{t('enums.incidentSeverity.high')}</SelectItem>
            <SelectItem value="critical">{t('enums.incidentSeverity.critical')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Section */}
      <Card className="overflow-hidden bg-card/40 backdrop-blur-xl shadow-2xl">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            <span className="font-medium text-muted-foreground animate-pulse">{t('op.loadingIncidents')}</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-2">
              <span className="text-2xl opacity-50"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></span>
            </div>
            <p className="font-medium text-muted-foreground">{t('op.noIncidentsMatch')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-card/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px]">{t('common.id')}</TableHead>
                  <TableHead>{t('op.incidentRefCol')}</TableHead>
                  <TableHead className="text-center">{t('common.severity')}</TableHead>
                  <TableHead className="text-center">{t('common.status')}</TableHead>
                  <TableHead>{t('op.timestamp')}</TableHead>
                  <TableHead className="text-right">{t('op.action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => (
                  <TableRow 
                    key={inc.id} 
                    className="group cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/dashboard/incidents/${inc.id}`)}
                  >
                    <TableCell className="font-heading text-xs text-muted-foreground">#{inc.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{inc.title}</span>
                        <span className="text-xs text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
                          {t(`enums.incidentType.${inc.type}`)} 
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50 inline-block" /> 
                          <span className="truncate max-w-[120px]">{t(`enums.incidentSource.${inc.source}`)}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={severityVariants[inc.severity] || 'outline'} className="uppercase text-[10px] tracking-wider">
                        {t(`enums.incidentSeverity.${inc.severity}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusVariants[inc.status] || 'outline'} className="uppercase text-[10px] tracking-wider">
                        {t(`enums.incidentStatus.${inc.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(inc.created_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
