"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import api from "@/lib/api";
import { FileText, Clock, AlertTriangle, CheckCircle2, Loader2, MapPin, ChevronRight, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

interface Report {
  id: number;
  type: string;
  severity: string;
  location_name?: string;
  title?: string;
  description: string;
  status: string;
  source?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  metadata?: {
    images?: string[];
  };
  location?: { lat: number; lng: number } | null;
  reporter?: { name: string; email?: string } | null;
}

const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
  low: { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  medium: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  high: { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  critical: { color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

export default function MyReportsPage() {
  const { t, locale } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/incidents?source=citizen&per_page=50');
      setReports(res.data.data || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }
    if (user) fetchReports();
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    open: { icon: <Clock className="w-3.5 h-3.5" />, color: "text-amber-500", label: t('citizen.pending') },
    pending: { icon: <Clock className="w-3.5 h-3.5" />, color: "text-muted-foreground", label: t('citizen.pending') },
    investigating: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-500", label: t('citizen.underReview') },
    reviewing: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-500", label: t('citizen.underReview') },
    resolved: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-500", label: t('citizen.resolved') },
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    day: "2-digit", month: "short", year: "numeric",
  });

  const pendingCount = reports.filter(r => r.status === "pending" || r.status === "open").length;
  const resolvedCount = reports.filter(r => r.status === "resolved").length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('citizen.myReports')}</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[52px]">
            {t('citizen.myReportsSubtitle')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading} className="gap-2 mt-1">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: t('citizen.total'), value: reports.length, color: "text-blue-500" },
          { label: t('citizen.pending'), value: pendingCount, color: "text-amber-500" },
          { label: t('citizen.resolved'), value: resolvedCount, color: "text-emerald-500" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-card/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Reports List */}
      {!loading && reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-6 bg-secondary rounded-full mb-6">
              <FileText className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('citizen.noReports')}</h2>
            <p className="text-muted-foreground max-w-sm mb-6">
              {t('citizen.noReportsDesc')}
            </p>
            <Button onClick={() => router.push("/map")} className="rounded-full px-6">
              {t('citizen.openLiveMap')}
            </Button>
          </CardContent>
        </Card>
      ) : !loading && (
        <div className="space-y-3">
          {reports.map((report) => {
            const sev = severityConfig[report.severity] || severityConfig.low;
            const stat = statusConfig[report.status] || statusConfig.pending;
            return (
              <Card
                key={report.id}
                className="bg-card/80 backdrop-blur hover:shadow-lg hover:border-primary/20 transition-all group cursor-pointer"
                onClick={() => setSelected(report)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Type + Severity */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-base font-bold">
                          {t(`enums.incidentType.${report.type}`)}
                        </span>
                        <Badge className={`text-[11px] font-bold uppercase tracking-wider ${sev.bg} ${sev.border} ${sev.color} border`}>
                          {t(`enums.incidentSeverity.${report.severity}`)}
                        </Badge>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{report.location_name || report.title}</span>
                      </div>

                      {/* Description */}
                      {report.description && (
                        <p className="text-sm text-muted-foreground/70 line-clamp-1">{report.description}</p>
                      )}
                    </div>

                    {/* Right side: Status + Time */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className={`flex items-center gap-1.5 text-xs font-semibold ${stat.color}`}>
                        {stat.icon}
                        {stat.label}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(report.created_at)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          {selected && (() => {
            const sev = severityConfig[selected.severity] || severityConfig.low;
            const stat = statusConfig[selected.status] || statusConfig.pending;
            const images = selected.metadata?.images || [];
            const hasCoords = selected.location && selected.location.lat && selected.location.lng;

            return (
              <>
                {/* Image banner */}
                {images.length > 0 && (
                  <div className="relative w-full h-48 bg-secondary overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={images[0]}
                      alt="Incident"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <Badge className={`text-[10px] font-bold uppercase tracking-wider border ${sev.bg} ${sev.border} ${sev.color}`}>
                        {t(`enums.incidentSeverity.${selected.severity}`)}
                      </Badge>
                      <Badge variant="secondary" className={`text-[10px] font-bold uppercase tracking-wider gap-1 ${stat.color} bg-white/90 dark:bg-black/60`}>
                        {stat.icon} {stat.label}
                      </Badge>
                    </div>
                    {images.length > 1 && (
                      <span className="absolute bottom-3 right-4 text-[10px] font-bold text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
                        +{images.length - 1} {t('common.photos') || 'photos'}
                      </span>
                    )}
                  </div>
                )}

                <div className={`${images.length > 0 ? 'p-5' : 'p-6'} space-y-4`}>
                  {/* Header */}
                  <DialogHeader className="p-0">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                      <Eye className="w-5 h-5 text-primary shrink-0" />
                      {selected.title || t(`enums.incidentType.${selected.type}`)}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 text-xs">
                      <span>#{selected.id}</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{formatDate(selected.created_at)}</span>
                    </DialogDescription>
                  </DialogHeader>

                  {/* Badges (if no image banner) */}
                  {images.length === 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider">
                        {t(`enums.incidentType.${selected.type}`)}
                      </Badge>
                      <Badge className={`text-[10px] font-bold uppercase tracking-wider border ${sev.bg} ${sev.border} ${sev.color}`}>
                        {t(`enums.incidentSeverity.${selected.severity}`)}
                      </Badge>
                      <Badge variant="secondary" className={`text-[10px] font-bold uppercase tracking-wider gap-1 ${stat.color}`}>
                        {stat.icon} {stat.label}
                      </Badge>
                    </div>
                  )}

                  {/* Location */}
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{t('report.location')}</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                      {selected.location_name || selected.title || '—'}
                    </p>
                    {hasCoords && (
                      <p className="text-[10px] font-mono text-muted-foreground mt-1.5 pl-6">
                        📍 {selected.location!.lat.toFixed(5)}, {selected.location!.lng.toFixed(5)}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {selected.description && (
                    <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{t('report.description')}</p>
                      <p className="text-sm leading-relaxed">{selected.description}</p>
                    </div>
                  )}

                  {/* Status Timeline */}
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{t('common.status')}</p>
                    <div className="flex items-center gap-1">
                      {['open', 'investigating', 'resolved'].map((step, idx) => {
                        const stepOrder = { open: 0, investigating: 1, resolved: 2 };
                        const currentOrder = stepOrder[selected.status as keyof typeof stepOrder] ?? 0;
                        const stepIdx = stepOrder[step as keyof typeof stepOrder];
                        const isActive = stepIdx <= currentOrder;
                        const isCurrent = step === selected.status;
                        const stepLabels: Record<string, string> = {
                          open: t('citizen.pending'),
                          investigating: t('citizen.underReview'),
                          resolved: t('citizen.resolved'),
                        };
                        return (
                          <div key={step} className="flex items-center gap-1 flex-1">
                            <div className={`flex flex-col items-center flex-1 ${isCurrent ? 'scale-105' : ''}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isActive
                                  ? step === 'resolved' ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {step === 'open' ? <Clock className="w-3.5 h-3.5" /> :
                                 step === 'investigating' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                                 <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                              <span className={`text-[9px] font-semibold mt-1 text-center leading-tight ${
                                isActive ? 'text-foreground' : 'text-muted-foreground'
                              }`}>{stepLabels[step]}</span>
                            </div>
                            {idx < 2 && (
                              <div className={`h-0.5 flex-1 rounded-full -mt-3 ${
                                stepIdx < currentOrder ? 'bg-primary' : 'bg-muted'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className={`grid ${selected.resolved_at ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                    <div className="bg-secondary/50 rounded-xl p-3 border border-border text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('citizen.submittedAt')}</p>
                      <p className="text-sm font-medium">{formatDate(selected.created_at)}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-3 border border-border text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('citizen.lastUpdated')}</p>
                      <p className="text-sm font-medium">{selected.updated_at ? formatDate(selected.updated_at) : '—'}</p>
                    </div>
                    {selected.resolved_at && (
                      <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/20 text-center">
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">{t('citizen.resolvedAt') || 'Resolved'}</p>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{formatDate(selected.resolved_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
