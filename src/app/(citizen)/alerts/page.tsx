"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import { useEchoMulti } from "@/hooks/useEcho";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Bell, AlertTriangle, Info, ShieldAlert, MapPin,
  Clock, Filter, Loader2, Navigation,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Alert {
  id: number;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  area: string;
  created_at: string;
  active: boolean;
  isLive?: boolean;
}

type SeverityFilter = "all" | "info" | "warning" | "critical";

const PAGE_SIZE = 10;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function mapSeverity(s: string): "info" | "warning" | "critical" {
  if (s === "critical") return "critical";
  if (s === "high")     return "warning";
  return "info";
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AlertsPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [filter, setFilter]       = useState<SeverityFilter>("all");
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [apiAlerts, setApiAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading]       = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    api.get("/incidents?per_page=30")
      .then(res => {
        const incidents: Array<{
          id: number; title: string; description?: string;
          severity: string; location_name?: string;
          created_at: string; status: string;
        }> = res.data.data || [];
        setApiAlerts(incidents.map(inc => ({
          id:          inc.id,
          title:       inc.title,
          description: inc.description || "",
          severity:    mapSeverity(inc.severity),
          area:        inc.location_name || "",
          created_at:  inc.created_at,
          active:      inc.status === "open" || inc.status === "investigating",
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Real-time WebSocket alerts
  useEchoMulti("traffic", {
    IncidentCreated: (data: {
      id?: number; title?: string; description?: string;
      severity?: string; location_name?: string; created_at?: string;
    }) => {
      setLiveAlerts(prev => [{
        id:          data.id || Date.now(),
        title:       data.title || t("citizen.trafficAdvisory"),
        description: data.description || "",
        severity:    mapSeverity(data.severity || "medium"),
        area:        data.location_name || "",
        created_at:  data.created_at || new Date().toISOString(),
        active:      true,
        isLive:      true,
      }, ...prev]);
    },
    RecommendationGenerated: (data: { action?: string; description?: string }) => {
      if (data.action !== "approved") return;
      setLiveAlerts(prev => [{
        id:          Date.now(),
        title:       t("citizen.trafficAdvisory"),
        description: data.description || t("citizen.trafficAdvisoryDesc"),
        severity:    "warning",
        area:        "",
        created_at:  new Date().toISOString(),
        active:      true,
        isLive:      true,
      }, ...prev]);
    },
  });

  const allAlerts = useMemo(() => [...liveAlerts, ...apiAlerts], [liveAlerts, apiAlerts]);

  const filtered = useMemo(
    () => filter === "all" ? allAlerts : allAlerts.filter(a => a.severity === filter),
    [allAlerts, filter]
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  // Reset visible count when filter changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [filter]);

  // Counts per severity for filter badges
  const counts = useMemo(() => ({
    all:      allAlerts.length,
    critical: allAlerts.filter(a => a.severity === "critical").length,
    warning:  allAlerts.filter(a => a.severity === "warning").length,
    info:     allAlerts.filter(a => a.severity === "info").length,
  }), [allAlerts]);

  const severityConfig = {
    info: {
      icon:   <Info className="w-4 h-4" />,
      color:  "text-blue-500",
      bg:     "bg-blue-500/10",
      border: "border-blue-500/20",
      pulse:  "bg-blue-400",
      dot:    "bg-blue-500",
      label:  t("citizen.info"),
    },
    warning: {
      icon:   <AlertTriangle className="w-4 h-4" />,
      color:  "text-amber-500",
      bg:     "bg-amber-500/10",
      border: "border-amber-500/20",
      pulse:  "bg-amber-400",
      dot:    "bg-amber-500",
      label:  t("citizen.warning"),
    },
    critical: {
      icon:   <ShieldAlert className="w-4 h-4" />,
      color:  "text-rose-500",
      bg:     "bg-rose-500/10",
      border: "border-rose-500/20",
      pulse:  "bg-rose-400",
      dot:    "bg-rose-500",
      label:  t("citizen.critical"),
    },
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* ─── Header ─── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("citizen.trafficAlerts")}</h1>
          {liveAlerts.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-wider animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {liveAlerts.length} {t("citizen.newAlert")}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm ml-[52px]">
          {t("citizen.alertsSubtitle")}
        </p>
      </div>

      {/* ─── Filter Tabs ─── */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        {(["all", "critical", "warning", "info"] as const).map(f => {
          const isActive = filter === f;
          const cfg = f !== "all" ? severityConfig[f] : null;
          const count = counts[f];
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-secondary text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {cfg ? (
                <>
                  <span className={isActive ? "text-primary-foreground" : cfg.color}>{cfg.icon}</span>
                  {cfg.label}
                </>
              ) : (
                t("citizen.allCount", { n: String(count) })
              )}
              {f !== "all" && count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20" : "bg-border/60"
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Loading ─── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* ─── Empty State ─── */}
      {!loading && filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-6 bg-secondary rounded-full mb-6">
              <Bell className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t("citizen.noAlerts")}</h2>
            <p className="text-muted-foreground max-w-sm">{t("citizen.noAlertsDesc")}</p>
          </CardContent>
        </Card>
      )}

      {/* ─── Alert List ─── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {visible.map(alert => {
            const sev = severityConfig[alert.severity];
            return (
              <Card
                key={`${alert.isLive ? "live" : "api"}-${alert.id}`}
                onClick={() => alert.active && router.push(`/map?incident=${alert.id}`)}
                className={`bg-card/80 backdrop-blur transition-all hover:shadow-lg border-l-2 ${
                  alert.severity === "critical" ? "border-l-rose-500" :
                  alert.severity === "warning"  ? "border-l-amber-500" :
                                                  "border-l-blue-500"
                } ${alert.active ? "hover:border-primary/20 cursor-pointer" : "opacity-60"}`}
              >
                <CardContent className="p-5 relative">
                  {/* Top-right: live indicator + view on map */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    {alert.isLive && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${sev.bg} ${sev.border} ${sev.color}`}>
                        {t("citizen.newAlert")}
                      </span>
                    )}
                    {alert.active && (
                      <>
                        <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 opacity-60">
                          <Navigation className="w-3 h-3" />
                          {t("common.viewOnMap")}
                        </span>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sev.pulse}`} />
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${sev.dot}`} />
                        </span>
                      </>
                    )}
                  </div>

                  {/* Severity badge + expired */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <Badge className={`text-[11px] font-bold uppercase tracking-wider gap-1.5 border ${sev.bg} ${sev.border} ${sev.color}`}>
                      {sev.icon}
                      {sev.label}
                    </Badge>
                    {!alert.active && (
                      <Badge variant="secondary" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t("citizen.expired")}
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-bold mb-1.5 pr-32">{alert.title}</h3>
                  {alert.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                      {alert.description}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {alert.area && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        {alert.area}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(alert.created_at).toLocaleString(
                        locale === "vi" ? "vi-VN" : "en-US",
                        { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Load more */}
          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-6 gap-2"
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              >
                {t("citizen.loadMore")}
                <span className="text-muted-foreground text-xs">({filtered.length - visibleCount} {t("op.more")})</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
