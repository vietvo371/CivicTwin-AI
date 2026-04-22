'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Plus, Eye, Clock, Filter,
  AlertCircle, CheckCircle2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Incident {
  id: number;
  title: string;
  type: string;
  severity: string;
  status: string;
  source: string;
  created_at: string;
}

type StatusFilter = 'all' | 'open' | 'investigating' | 'resolved' | 'closed';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const severityVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'secondary', medium: 'outline', high: 'default', critical: 'destructive',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default', investigating: 'secondary', resolved: 'outline', closed: 'outline',
};

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

/* ─── Skeleton rows ──────────────────────────────────────────────────────── */

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><div className="h-4 w-8 bg-muted animate-pulse rounded" /></TableCell>
          <TableCell>
            <div className="space-y-2">
              <div className="h-4 w-44 bg-muted animate-pulse rounded" />
              <div className="h-3 w-28 bg-muted animate-pulse rounded" />
            </div>
          </TableCell>
          <TableCell className="text-center"><div className="h-5 w-16 bg-muted animate-pulse rounded-full mx-auto" /></TableCell>
          <TableCell className="text-center"><div className="h-5 w-20 bg-muted animate-pulse rounded-full mx-auto" /></TableCell>
          <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
          <TableCell className="text-right"><div className="h-8 w-8 bg-muted animate-pulse rounded ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

/* ─── Status Filter Tabs ─────────────────────────────────────────────────── */

function StatusTabs({
  active,
  onChange,
}: {
  active: StatusFilter;
  onChange: (s: StatusFilter) => void;
}) {
  const { t } = useTranslation();

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all',           label: t('op.anyStatus') },
    { key: 'open',          label: t('op.filterOpen') },
    { key: 'investigating', label: t('op.filterInvestigating') },
    { key: 'resolved',      label: t('op.filterResolved') },
    { key: 'closed',        label: t('op.filterClosed') },
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tabs.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Pagination Bar ─────────────────────────────────────────────────────── */

function Pagination({
  total,
  page,
  lastPage,
  pageSize,
  onPage,
  onPageSize,
}: {
  total: number;
  page: number;
  lastPage: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  const { t } = useTranslation();

  const pages = useMemo(() => {
    if (lastPage <= 7) return Array.from({ length: lastPage }, (_, i) => i + 1);
    const result: (number | '…')[] = [1];
    if (page > 3) result.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(lastPage - 1, page + 1); i++) result.push(i);
    if (page < lastPage - 2) result.push('…');
    result.push(lastPage);
    return result;
  }, [page, lastPage]);

  const navBtn = (disabled: boolean, onClick: () => void, icon: React.ReactNode, label: string) => (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center w-8 h-8 rounded-md text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted text-muted-foreground hover:text-foreground"
    >
      {icon}
    </button>
  );

  const from = Math.min((page - 1) * pageSize + 1, total);
  const to   = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/60 text-xs text-muted-foreground">
      {/* Left: page size + range */}
      <div className="flex items-center gap-3">
        <select
          value={pageSize}
          onChange={(e) => { onPageSize(Number(e.target.value)); onPage(1); }}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s} {t('op.perPage')}</option>
          ))}
        </select>
        <span className="tabular-nums">{from}–{to} / {total}</span>
      </div>

      {/* Right: page buttons */}
      <div className="flex items-center gap-0.5">
        {navBtn(page === 1,        () => onPage(1),          <ChevronsLeft  className="w-3.5 h-3.5" />, 'First')}
        {navBtn(page === 1,        () => onPage(page - 1),   <ChevronLeft   className="w-3.5 h-3.5" />, 'Prev')}

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="w-8 text-center select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          )
        )}

        {navBtn(page >= lastPage, () => onPage(page + 1),   <ChevronRight  className="w-3.5 h-3.5" />, 'Next')}
        {navBtn(page >= lastPage, () => onPage(lastPage),   <ChevronsRight className="w-3.5 h-3.5" />, 'Last')}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function IncidentsPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', String(pageSize));
      if (statusFilter !== 'all')   params.set('status',   statusFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      const res = await api.get(`/incidents?${params}`);
      const meta = res.data.meta;
      setIncidents(res.data.data || []);
      setTotal(meta?.total ?? res.data.data?.length ?? 0);
      setLastPage(meta?.last_page ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, severityFilter]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [statusFilter, severityFilter, pageSize]);
  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api.post('/incidents', {
        title:       form.get('title'),
        type:        form.get('type'),
        severity:    form.get('severity'),
        source:      'operator',
        description: form.get('description'),
      });
      setCreateOpen(false);
      fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const tableHeader = (
    <TableRow className="hover:bg-transparent">
      <TableHead className="w-[60px]">{t('common.id')}</TableHead>
      <TableHead className="min-w-[240px]">{t('op.incidentRefCol')}</TableHead>
      <TableHead className="text-center w-[110px]">{t('common.severity')}</TableHead>
      <TableHead className="text-center w-[130px]">{t('common.status')}</TableHead>
      <TableHead className="w-[150px]">{t('op.timestamp')}</TableHead>
      <TableHead className="text-right w-[60px]">{t('op.action')}</TableHead>
    </TableRow>
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.trafficIncidents')}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t('op.activeIncidentsCount', { n: String(total) })}
            </p>
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Plus className="w-4 h-4" /> {t('op.reportIncident')}
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                {t('op.reportNewIncident')}
              </DialogTitle>
              <DialogDescription>{t('op.reportNewDesc')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('op.titleLabel')}</label>
                <Input name="title" required placeholder={t('op.titlePlaceholder')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('op.incidentType')}</label>
                  <select name="type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <option value="accident">{t('enums.incidentType.accident')}</option>
                    <option value="congestion">{t('enums.incidentType.congestion')}</option>
                    <option value="construction">{t('enums.incidentType.construction')}</option>
                    <option value="weather">{t('enums.incidentType.weather')}</option>
                    <option value="other">{t('enums.incidentType.other')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('common.severity')}</label>
                  <select name="severity" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <option value="low">{t('enums.incidentSeverity.low')}</option>
                    <option value="medium">{t('enums.incidentSeverity.medium')}</option>
                    <option value="high">{t('enums.incidentSeverity.high')}</option>
                    <option value="critical">{t('enums.incidentSeverity.critical')}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('op.detailsLabel')}</label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  placeholder={t('op.detailsPlaceholder')}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit">{t('op.submitReport')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Card */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/80 shadow-2xl">
        {/* Toolbar: status tabs + severity filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border/60">
          <StatusTabs active={statusFilter} onChange={(s) => setStatusFilter(s)} />

          <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v ?? 'all'); setPage(1); }}>
            <SelectTrigger className="w-[170px] h-8 text-xs bg-muted/40">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                <SelectValue placeholder={t('common.severity')} />
              </div>
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

        <div className="overflow-x-auto w-full">
          <Table style={{ minWidth: '680px' }}>
            <TableHeader className="bg-muted/40">{tableHeader}</TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonRows />
              ) : incidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-50" />
                      </div>
                      <p className="font-medium text-muted-foreground">{t('op.noIncidentsMatch')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                incidents.map((inc) => (
                  <TableRow
                    key={inc.id}
                    className="group cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => router.push(`/dashboard/incidents/${inc.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">#{inc.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{inc.title}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          {t(`enums.incidentType.${inc.type}`)}
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40 inline-block" />
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
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="tabular-nums">
                          {new Date(inc.created_at).toLocaleString(
                            locale === 'vi' ? 'vi-VN' : 'en-US',
                            { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/incidents/${inc.id}`); }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination — always show when not loading */}
        {!loading && (
          <Pagination
            total={total}
            page={page}
            lastPage={lastPage}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        )}
      </Card>
    </div>
  );
}
