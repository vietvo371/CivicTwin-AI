'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  X, MapPin, Clock, AlertTriangle, Shield, Route, Bell,
  Brain, Zap, ChevronLeft, ChevronRight, Image as ImageIcon,
  CheckCircle2, Construction, CarFront, Gauge, ThumbsUp,
} from 'lucide-react';

const SEVERITY_COLOR: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  low:      { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: '#10b981' },
  medium:   { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  text: 'text-yellow-400',  dot: '#eab308' },
  high:     { bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  text: 'text-orange-400',  dot: '#f97316' },
  critical: { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     dot: '#ef4444' },
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Đang mở', investigating: 'Đang xử lý', resolved: 'Đã giải quyết', closed: 'Đã đóng',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  accident:     <CarFront className="w-4 h-4" />,
  congestion:   <Gauge className="w-4 h-4" />,
  construction: <Construction className="w-4 h-4" />,
  weather:      <AlertTriangle className="w-4 h-4" />,
  other:        <AlertTriangle className="w-4 h-4" />,
};

const REC_ICON: Record<string, React.ReactNode> = {
  reroute:          <Route className="w-3.5 h-3.5" />,
  priority_route:   <Shield className="w-3.5 h-3.5" />,
  alert:            <Bell className="w-3.5 h-3.5" />,
  signal_change:    <Zap className="w-3.5 h-3.5" />,
  alternative_route:<Route className="w-3.5 h-3.5" />,
  advisory:         <Bell className="w-3.5 h-3.5" />,
};

interface Props {
  incidentId: number;
  onClose: () => void;
}

export default function IncidentDetailModal({ incidentId, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/public/incidents/${incidentId}`)
      .then(r => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [incidentId]);

  const sev = SEVERITY_COLOR[data?.severity] ?? SEVERITY_COLOR.medium;
  const images: string[] = data?.images ?? [];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 max-h-[90dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin" />
          </div>
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
            Không tải được dữ liệu
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Image gallery */}
            {images.length > 0 ? (
              <div className="relative w-full h-52 bg-muted shrink-0">
                <img
                  src={images[imgIdx]}
                  alt="incident"
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card" />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setImgIdx(i => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImgIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white w-4' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-28 bg-muted/50 flex items-center justify-center shrink-0">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}

            {/* Content */}
            <div className="px-5 py-4 space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${sev.bg} ${sev.border} ${sev.text}`}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sev.dot }} />
                    {data.severity}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full">
                    {TYPE_ICON[data.type] ?? TYPE_ICON.other}
                    {data.type}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium ml-auto">
                    {STATUS_LABEL[data.status] ?? data.status}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground leading-tight">{data.title}</h2>
                {data.description && (
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{data.description}</p>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-medium">
                {data.location_name && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {data.location_name}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {new Date(data.created_at).toLocaleString('vi-VN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                {(data.affected_edge_ids?.length ?? 0) > 0 && (
                  <span className="flex items-center gap-1.5 text-orange-400/80">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {data.affected_edge_ids.length} đoạn đường bị ảnh hưởng
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* AI Prediction */}
              {data.prediction ? (
                <div className="rounded-xl border border-purple-500/25 bg-purple-950/20 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="text-sm font-bold text-foreground">Phân tích AI</span>
                    <span className="ml-auto text-[10px] font-bold text-purple-500 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                      {data.prediction.model_version ?? 'ST-GCN'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/60 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-black text-foreground">
                        {data.prediction.edges_count}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Đoạn phân tích</div>
                    </div>
                    <div className="bg-muted/60 rounded-lg p-2.5 text-center">
                      <div className={`text-lg font-black ${(data.prediction.max_density ?? 0) > 0.6 ? 'text-red-500' : 'text-yellow-500'}`}>
                        {Math.round((data.prediction.max_density ?? 0) * 100)}%
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Mật độ tối đa</div>
                    </div>
                    <div className="bg-muted/60 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-black text-emerald-500">
                        {Math.round((data.prediction.avg_confidence ?? 0) * 100)}%
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Độ tin cậy</div>
                    </div>
                  </div>
                  {data.prediction.processing_time_ms && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Xử lý trong {data.prediction.processing_time_ms}ms
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3 text-muted-foreground">
                  <Brain className="w-4 h-4 shrink-0" />
                  <span className="text-sm">Chưa có phân tích AI cho sự cố này</span>
                </div>
              )}

              {/* Recommendations */}
              {data.recommendations?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Khuyến nghị đã duyệt
                  </div>
                  {data.recommendations.map((rec: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500 shrink-0 mt-0.5">
                        {REC_ICON[rec.type] ?? <ThumbsUp className="w-3.5 h-3.5" />}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom padding */}
              <div className="h-2" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
