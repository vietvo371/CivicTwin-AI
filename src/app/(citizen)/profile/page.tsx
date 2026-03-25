"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  UserCircle, Mail, Phone, Shield, Camera, FileText, Bell,
  Loader2, Save, Check, MapPin, Calendar, TrendingUp, Sparkles
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
    if (user) {
      setName(user.name || "");
      setPhone((user as any).phone || "");
      api.get('/incidents?source=citizen&per_page=1').then(res => {
        setReportCount(res.data?.meta?.total || res.data?.data?.length || 0);
      }).catch(() => {});
      api.get('/incidents?per_page=1').then(res => {
        setAlertCount(res.data?.meta?.total || res.data?.data?.length || 0);
      }).catch(() => {});
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const getInitials = (n: string) =>
    n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/profile', { name, phone: phone || null });
      setSaved(true);
      toast.success(t('citizen.profileUpdated'));
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error(t('citizen.profileUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const providerLabel = user?.roles?.includes("citizen")
    ? t('citizen.citizenRole')
    : user?.roles?.includes("traffic_operator")
    ? t('citizen.operatorRole')
    : t('citizen.userRole');

  const joinDate = (user as any).created_at
    ? new Date((user as any).created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* ═══ Hero Card ═══ */}
      <div className="relative overflow-hidden rounded-3xl mb-8">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative px-8 pt-10 pb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-white/20 rounded-full blur-sm group-hover:bg-white/30 transition-all" />
              <Avatar className="relative w-28 h-28 border-4 border-white/30 shadow-2xl">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-2xl font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </button>
              {/* Online dot */}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-400 border-[3px] border-white rounded-full shadow-lg" />
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">{user.name}</h1>
              <p className="text-white/60 text-sm mt-1">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-xs font-bold text-white uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  {providerLabel}
                </span>
                {joinDate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs text-white/70">
                    <Calendar className="w-3 h-3" />
                    {joinDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row - embedded in hero */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10 hover:bg-white/15 transition-colors">
              <FileText className="w-5 h-5 text-emerald-300 mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-white">{reportCount}</p>
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mt-0.5">{t('citizen.reportsSubmitted')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10 hover:bg-white/15 transition-colors">
              <Bell className="w-5 h-5 text-amber-300 mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-white">{alertCount}</p>
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mt-0.5">{t('citizen.alertsReceived')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10 hover:bg-white/15 transition-colors">
              <TrendingUp className="w-5 h-5 text-cyan-300 mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-white">{reportCount + alertCount}</p>
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mt-0.5">{t('citizen.activitySummary')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Edit Form Card ═══ */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Card header with accent line */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="px-6 sm:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{t('citizen.personalInfo')}</h3>
              <p className="text-xs text-muted-foreground">{t('citizen.profileSubtitle')}</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-muted-foreground" />
                {t('citizen.fullName')}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary/50 border-border h-12 focus-visible:ring-blue-500/50 font-medium text-base rounded-xl"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {t('citizen.emailAddress')}
              </label>
              <div className="relative">
                <Input
                  value={user.email}
                  disabled
                  className="bg-muted/30 border-border text-muted-foreground h-12 font-medium cursor-not-allowed text-base rounded-xl pr-20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {t('citizen.emailFixed')}
                </span>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {t('citizen.phoneNumber')}
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+84 xxx xxx xxx"
                className="bg-secondary/50 border-border h-12 focus-visible:ring-blue-500/50 font-medium text-base rounded-xl"
              />
            </div>

            {/* Location (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {t('common.city') || 'City'}
              </label>
              <Input
                value="Đà Nẵng, Việt Nam"
                disabled
                className="bg-muted/30 border-border text-muted-foreground h-12 font-medium cursor-not-allowed text-base rounded-xl"
              />
            </div>

            {/* Save Button */}
            <div className="pt-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-10 h-12 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all rounded-xl text-base"
              >
                {saving ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('report.submitting')}</span>
                ) : saved ? (
                  <span className="flex items-center gap-2"><Check className="w-4 h-4" /> {t('citizen.saved')}</span>
                ) : (
                  <span className="flex items-center gap-2"><Save className="w-4 h-4" /> {t('citizen.saveChanges')}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
