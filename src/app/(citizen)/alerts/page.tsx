"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useEcho } from "@/hooks/useEcho";
import api from "@/lib/api";
import { Bell, AlertTriangle, Info, ShieldAlert, MapPin, Clock, Filter, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: number;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  area: string;
  created_at: string;
  active: boolean;
}

function mapSeverity(s: string): "info" | "warning" | "critical" {
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'warning';
  return 'info';
}

export default function AlertsPage() {
  const { t, locale } = useTranslation();
  const [filter, setFilter] = useState<"all" | "info" | "warning" | "critical">("all");
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [apiAlerts, setApiAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/incidents?per_page=30');
        const incidents = res.data.data || [];
        setApiAlerts(incidents.map((inc: any) => ({
          id: inc.id,
          title: inc.title,
          description: inc.description || '',
          severity: mapSeverity(inc.severity),
          area: inc.location_name || '',
          created_at: inc.created_at,
          active: inc.status === 'open' || inc.status === 'investigating',
        })));
      } catch { /* keep empty */ }
      finally { setLoading(false); }
    };
    fetchAlerts();
  }, []);

  // Real-time: new incidents appear as alerts
  useEcho<any>('traffic', 'IncidentCreated', (data) => {
    const newAlert: Alert = {
      id: data.id || Date.now(),
      title: data.title || 'New Incident',
      description: data.description || '',
      severity: mapSeverity(data.severity || 'medium'),
      area: data.location_name || '',
      created_at: data.created_at || new Date().toISOString(),
      active: true,
    };
    setLiveAlerts(prev => [newAlert, ...prev]);
  });

  const allAlerts = [...liveAlerts, ...apiAlerts];
  const filteredAlerts = filter === "all" ? allAlerts : allAlerts.filter((a) => a.severity === filter);

  const severityConfig = {
    info: { icon: <Info className="w-4 h-4" />, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", label: t('citizen.info') },
    warning: { icon: <AlertTriangle className="w-4 h-4" />, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: t('citizen.warning') },
    critical: { icon: <ShieldAlert className="w-4 h-4" />, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", label: t('citizen.critical') },
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('citizen.trafficAlerts')}</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-[52px]">
          {t('citizen.alertsSubtitle')}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        {(["all", "critical", "warning", "info"] as const).map((f) => {
          const isActive = filter === f;
          const config = f !== "all" ? severityConfig[f] : null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {config ? (
                <span className="flex items-center gap-1.5">
                  {config.icon}
                  {config.label}
                </span>
              ) : (
                t('citizen.allCount', { n: String(allAlerts.length) })
              )}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Alerts List */}
      {!loading && filteredAlerts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-6 bg-secondary rounded-full mb-6">
              <Bell className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('citizen.noAlerts')}</h2>
            <p className="text-muted-foreground max-w-sm">
              {t('citizen.noAlertsDesc')}
            </p>
          </CardContent>
        </Card>
      ) : !loading && (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const sev = severityConfig[alert.severity];
            return (
              <Card
                key={alert.id}
                className={`bg-card/80 backdrop-blur transition-all hover:shadow-lg ${
                  alert.active ? "hover:border-primary/20" : "opacity-60"
                }`}
              >
                <CardContent className="p-5 relative">
                  {/* Active pulse indicator */}
                  {alert.active && (
                    <div className="absolute top-5 right-5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          alert.severity === "critical" ? "bg-rose-400" : "bg-amber-400"
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          alert.severity === "critical" ? "bg-rose-500" : "bg-amber-500"
                        }`}></span>
                      </span>
                    </div>
                  )}

                  {/* Severity Badge + Title */}
                  <div className="flex items-center gap-3 mb-2.5">
                    <Badge className={`text-[11px] font-bold uppercase tracking-wider gap-1.5 border ${sev.bg} ${sev.border} ${sev.color}`}>
                      {sev.icon}
                      {sev.label}
                    </Badge>
                    {!alert.active && (
                      <Badge variant="secondary" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t('citizen.expired')}
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-bold mb-1.5">{alert.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{alert.description}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      {alert.area}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(alert.created_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
