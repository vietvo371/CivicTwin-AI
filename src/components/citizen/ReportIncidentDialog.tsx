"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Camera, AlertTriangle, Sparkles, Loader2, Eye, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function ReportIncidentDialog() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [incidentType, setIncidentType] = useState('accident');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI states
  const [gpsLoading, setGpsLoading] = useState(false);
  const [aiParseLoading, setAiParseLoading] = useState(false);
  const [aiVisionLoading, setAiVisionLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiVisionResult, setAiVisionResult] = useState<Record<string, any> | null>(null);

  const handleOpenAlert = () => {
    if (!user) {
      toast.error(t('auth.authRequired'), {
        description: t('auth.authRequiredDesc'),
        action: {
          label: t('auth.signIn'),
          onClick: () => router.push("/?redirect=/map")
        }
      });
      return;
    }
    setOpen(true);
  };

  // ─── MODULE 1: GPS (tự chạy khi mở dialog + nút làm lại) ───
  const requestCurrentLocation = useCallback(
    (opts?: { silent?: boolean }) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        if (!opts?.silent) toast.error(t("report.gpsNotSupported"));
        return;
      }
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoords({ lat, lng });
          const fallbackLine = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

          if (!MAPBOX_TOKEN.trim()) {
            setLocation(fallbackLine);
            setGpsLoading(false);
            if (!opts?.silent) {
              toast.success(`📍 ${t("report.gpsLocated")}`, {
                description: t("report.gpsNoMapboxToken"),
              });
            }
            return;
          }

          try {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=vi&limit=1`
            );
            const geo = await res.json();
            const placeName =
              geo.features?.[0]?.place_name || fallbackLine;
            setLocation(placeName);
            if (!opts?.silent) {
              toast.success(`📍 ${t("report.gpsLocated")}`, {
                description: placeName,
              });
            }
          } catch {
            setLocation(fallbackLine);
            if (!opts?.silent) {
              toast.success(`📍 ${t("report.gpsLocated")}`, {
                description: fallbackLine,
              });
            }
          }
          setGpsLoading(false);
        },
        (err) => {
          if (!opts?.silent) {
            toast.error(`${t("report.gpsFailed")}: ${err.message}`);
          }
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    },
    [t]
  );

  const gpsOpenCycleRef = useRef(0);
  useEffect(() => {
    if (!open) return;
    const cycle = ++gpsOpenCycleRef.current;
    const id = window.setTimeout(() => {
      if (gpsOpenCycleRef.current !== cycle) return;
      requestCurrentLocation({ silent: true });
    }, 400);
    return () => clearTimeout(id);
  }, [open, requestCurrentLocation]);

  // ─── MODULE 2: Groq NLP Auto-Fill ───
  const handleAIParse = async () => {
    if (!description.trim()) {
      toast.error(t('report.aiParseEmpty'));
      return;
    }
    setAiParseLoading(true);
    setAiSuggestion(null);
    try {
      const res = await api.post('/ai/parse-report', { text: description });
      const data = res.data?.data;

      if (data?.error === 'NOT_ENOUGH_INFO') {
        toast.warning('🤖 ' + (data.message || t('report.aiParseNotEnough')));
        setAiParseLoading(false);
        return;
      }

      // Auto-fill form fields from AI response
      if (data?.type && ['accident', 'congestion', 'construction', 'weather', 'other'].includes(data.type)) {
        setIncidentType(data.type);
      }
      if (data?.severity && ['low', 'medium', 'high', 'critical'].includes(data.severity)) {
        setSeverity(data.severity);
      }
      if (data?.location && !location.trim()) {
        setLocation(data.location);
      }
      setAiSuggestion(data?.summary || data?.title || null);
      toast.success(t('report.aiParseSuccess'), {
        description: data?.summary || t('report.aiAutoFilled'),
      });
    } catch {
      toast.error(t('report.aiParseFailed'));
    }
    setAiParseLoading(false);
  };

  // ─── MODULE 3: Groq Vision ───
  const handleImageSelect = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('report.imageTooLarge'));
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    // Auto-analyze with Vision
    setAiVisionLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/ai/analyze-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data;
      const envelopeMsg = typeof res.data?.message === 'string' ? res.data.message : '';

      const isVisionObject =
        data !== null && typeof data === 'object' && !Array.isArray(data);
      if (!isVisionObject) {
        toast.warning(envelopeMsg || t('report.aiVisionFailed'));
        setAiVisionLoading(false);
        return;
      }

      if (data?.type && ['accident', 'congestion', 'construction', 'weather', 'other'].includes(data.type)) {
        setIncidentType(data.type);
      }
      if (data?.severity && ['low', 'medium', 'high', 'critical'].includes(data.severity)) {
        setSeverity(data.severity);
      }
      if (data?.description) {
        setDescription(data.description);
        setAiSuggestion(data.description);
      }
      setAiVisionResult(data);

      const conf = data?.confidence ? `(${(data.confidence * 100).toFixed(0)}%)` : '';
      if (data?.unclear) {
        toast.warning(envelopeMsg || t('report.aiVisionFailed'), {
          description: [data.user_hint, data.description].filter(Boolean).join(' ') || undefined,
        });
      } else {
        toast.success(`${t('report.aiVisionSuccess')} ${conf}`, {
          description: data?.description || t('report.aiVisionDetected'),
        });
      }
    } catch {
      // Vision fail is non-blocking - user can still submit
      toast.info(t('report.aiVisionFailed'));
    }
    setAiVisionLoading(false);
  };

  // ─── SUBMIT ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ─── Validation ───
    if (!coords) {
      toast.error(t('report.validGpsRequired'), {
        description: t('report.validGpsDesc'),
      });
      return;
    }
    if (location.trim().length < 5) {
      toast.error(t('report.validLocationMin'), {
        description: t('report.validLocationEx'),
      });
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      toast.error(t('report.validDescMin'), {
        description: t('report.validDescEx'),
      });
      return;
    }
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', `${t(`enums.incidentType.${incidentType}`)} - ${location}`);
      formData.append('type', incidentType);
      formData.append('severity', severity);
      if (description) formData.append('description', description);
      formData.append('source', 'citizen');
      formData.append('location_name', location);
      if (coords) {
        formData.append('latitude', coords.lat.toString());
        formData.append('longitude', coords.lng.toString());
      }
      if (imageFile) formData.append('image', imageFile);

      await api.post('/incidents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setOpen(false);
      resetForm();
      toast.success(t('report.incidentReported'), {
        description: t('report.reportSuccess'),
      });
    } catch {
      toast.error(t('report.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLocation('');
    setCoords(null);
    setDescription('');
    setIncidentType('accident');
    setSeverity('medium');
    setImageFile(null);
    setPreviewUrl('');
    setAiSuggestion(null);
    setAiVisionResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        onClick={(e) => {
          if (!user) {
            e.preventDefault();
            handleOpenAlert();
          }
        }}
        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 px-6 rounded-full shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] transition-all transform hover:scale-105 group border border-rose-500/50"
      >
        <AlertTriangle className="w-6 h-6 animate-pulse group-hover:animate-none" />
        <span>{t('report.reportIncident')}</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl bg-white dark:bg-slate-900/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500"></div>

        <DialogHeader className="p-6 pb-4 border-b border-slate-200 dark:border-white/5 flex flex-row items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div className="text-left space-y-1">
            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('report.reportTitle')}</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {t('report.reportDesc')}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Location + GPS */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('report.location')}</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className={`shrink-0 h-11 transition-all ${coords
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/10'
                  }`}
                onClick={() => requestCurrentLocation()}
                disabled={gpsLoading}
              >
                {gpsLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : coords ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                ) : (
                  <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                )}
                {coords ? t('report.gpsConfirmed') : t('report.currentGPS')}
              </Button>
              <Input
                placeholder={t('report.locationPlaceholder')}
                className="bg-slate-100 dark:bg-black/40 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white h-11 focus-visible:ring-rose-500/50"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            {coords && (
              <p className="text-[10px] text-emerald-400/80 font-mono pl-1">
                📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
            <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-1 leading-relaxed">
              {t("report.locationAutoGpsHint")}
            </p>
          </div>

          {/* Type & Severity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('op.incidentType')}</label>
              <Select required value={incidentType} onValueChange={(v) => setIncidentType(v || 'accident')}>
                <SelectTrigger className="bg-slate-100 dark:bg-black/40 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white h-11 focus:ring-rose-500/50">
                  <SelectValue placeholder={t('report.selectType')} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                  <SelectItem value="accident">{t('report.accidentCrash')}</SelectItem>
                  <SelectItem value="congestion">{t('report.congestion')}</SelectItem>
                  <SelectItem value="construction">{t('report.roadWorkBlocked')}</SelectItem>
                  <SelectItem value="weather">{t('report.floodWeather')}</SelectItem>
                  <SelectItem value="other">{t('report.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('common.severity')}</label>
              <Select required value={severity} onValueChange={(v) => setSeverity(v || 'medium')}>
                <SelectTrigger className="bg-slate-100 dark:bg-black/40 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white h-11 focus:ring-rose-500/50">
                  <SelectValue placeholder={t('report.selectSeverity')} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                  <SelectItem value="low">{t('report.lowPartial')}</SelectItem>
                  <SelectItem value="medium">{t('report.mediumDelay')}</SelectItem>
                  <SelectItem value="high">{t('report.highGridlock')}</SelectItem>
                  <SelectItem value="critical">{t('report.critical')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description + AI Parse */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('report.descriptionOptional')}</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 hover:bg-violet-500/10 gap-1.5 font-semibold"
                onClick={handleAIParse}
                disabled={aiParseLoading || !description.trim()}
              >
                {aiParseLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {aiParseLoading ? t('report.aiParsing') : t('report.aiParse')}
              </Button>
            </div>
            <Textarea
              placeholder={t('report.descriptionPlaceholder')}
              className="bg-slate-100 dark:bg-black/40 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white min-h-[80px] focus-visible:ring-rose-500/50 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-[10px] text-slate-500 pl-1">{t('report.descriptionHint')}</p>
          </div>

          {/* AI Vision Analysis Card */}
          {aiVisionResult && (
            <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-emerald-50 dark:from-emerald-950/50 via-slate-50 dark:via-slate-900/80 to-white dark:to-slate-900/50 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Glow top bar */}
              <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500" />
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300 uppercase tracking-wider">{t('report.aiVisionTitle')}</span>
                  </div>
                  <button type="button" onClick={() => { setAiVisionResult(null); setAiSuggestion(null); }} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Detected badges */}
                <div className="flex flex-wrap gap-2">
                  {aiVisionResult.type && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/15 text-blue-300 border border-blue-500/25">
                      {aiVisionResult.type}
                    </span>
                  )}
                  {aiVisionResult.severity && (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${aiVisionResult.severity === 'critical' ? 'bg-rose-500/15 text-rose-300 border-rose-500/25' :
                        aiVisionResult.severity === 'high' ? 'bg-orange-500/15 text-orange-300 border-orange-500/25' :
                          aiVisionResult.severity === 'medium' ? 'bg-amber-500/15 text-amber-300 border-amber-500/25' :
                            'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                      }`}>
                      {aiVisionResult.severity}
                    </span>
                  )}
                </div>

                {/* Description */}
                {aiVisionResult.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {aiVisionResult.description}
                  </p>
                )}

                {/* Confidence bar */}
                {aiVisionResult.confidence != null && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{t('report.aiVisionConfidence')}</span>
                      <span className="text-[10px] font-bold text-emerald-300">{(aiVisionResult.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(aiVisionResult.confidence * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {t('report.aiVisionAutoFill')}
                </p>
              </div>
            </div>
          )}

          {/* Photo Upload + Vision */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('report.photoEvidence')}</label>
              {aiVisionLoading && (
                <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold animate-pulse">
                  <Eye className="w-3.5 h-3.5" /> {t('report.aiVisionAnalyzing')}
                </span>
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg, image/png, image/jpg"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file);
              }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer bg-slate-50/50 dark:bg-black/20 min-h-[120px] overflow-hidden group ${aiVisionLoading
                  ? 'border-amber-500/30 animate-pulse'
                  : previewUrl
                    ? 'border-emerald-500/30'
                    : 'border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20'
                }`}
            >
              {previewUrl ? (
                <div className="relative w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="w-full object-cover rounded-lg group-hover:opacity-80 transition-opacity" style={{ maxHeight: '180px' }} />
                  {aiVisionLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t('report.aiParsing')}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-5 flex flex-col items-center">
                  <Camera className="w-8 h-8 mb-2 opacity-50 group-hover:text-rose-400 group-hover:opacity-100 transition-colors" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('report.clickUpload')}</p>
                  <p className="text-[10px] opacity-50 mt-1">{t('report.photoHint')}</p>
                </div>
              )}
            </div>
            {previewUrl && (
              <Button type="button" variant="ghost" size="sm" className="mt-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 text-xs font-semibold w-full" onClick={() => { setImageFile(null); setPreviewUrl(''); }}>
                {t('report.removePhoto')}
              </Button>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full text-base font-bold h-12 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white border-0 shadow-lg shadow-rose-900/50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('report.submitting')}
                </>
              ) : t('report.submitReport')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
