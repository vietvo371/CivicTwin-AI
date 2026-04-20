'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  Settings, Globe, Bell, Shield, Clock, Save,
  Database, Cpu, MapPin, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Settings className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('settings.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('settings.subtitle')}</p>
          </div>
        </div>
        <Button onClick={handleSave} className="shadow-lg shadow-primary/20">
          {saved ? (
            <span className="flex items-center gap-2 text-emerald-300"><Zap className="w-4 h-4" /> {t('settings.saved')}</span>
          ) : (
            <span className="flex items-center gap-2"><Save className="w-4 h-4" /> {t('settings.saveChanges')}</span>
          )}
        </Button>
      </div>

      {/* General */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/80">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" /> {t('settings.general')}
          </CardTitle>
          <CardDescription>{t('settings.generalDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.systemName')}</label>
              <Input defaultValue="CivicTwin AI - Da Nang" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.defaultLanguage')}</label>
              <Select defaultValue="vi">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">{t('settings.vietnamese')}</SelectItem>
                  <SelectItem value="en">{t('settings.english')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.mapCenterLat')}</label>
              <Input type="number" defaultValue="16.0544" step="0.0001" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.mapCenterLng')}</label>
              <Input type="number" defaultValue="108.2022" step="0.0001" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/80">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-500" /> {t('settings.aiEngine')}
          </CardTitle>
          <CardDescription>{t('settings.aiEngineDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.activeModel')}</label>
              <Select defaultValue="gnn-v2.1">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gnn-v2.1">{t('settings.modelGnn')}</SelectItem>
                  <SelectItem value="lstm-v1.4">{t('settings.modelLstm')}</SelectItem>
                  <SelectItem value="ensemble">{t('settings.modelEnsemble')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.predictionHorizon')}</label>
              <Input type="number" defaultValue="30" min="5" max="120" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.confidenceThreshold')}</label>
              <Input type="number" defaultValue="0.75" step="0.05" min="0" max="1" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.autoTrigger')}</label>
              <Select defaultValue="yes">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t('settings.enabled')}</SelectItem>
                  <SelectItem value="no">{t('settings.disabled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/80">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" /> {t('settings.notifications')}
          </CardTitle>
          <CardDescription>{t('settings.notificationsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.citizenAlertRadius')}</label>
              <Input type="number" defaultValue="5" min="1" max="50" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.criticalAlertChannel')}</label>
              <Select defaultValue="push_email">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">{t('settings.pushOnly')}</SelectItem>
                  <SelectItem value="email">{t('settings.emailOnly')}</SelectItem>
                  <SelectItem value="push_email">{t('settings.pushEmail')}</SelectItem>
                  <SelectItem value="sms">{t('settings.smsPremium')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/80">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" /> {t('settings.dataRetention')}
          </CardTitle>
          <CardDescription>{t('settings.dataRetentionDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.sensorData')}</label>
              <Select defaultValue="90">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">{t('settings.days', { n: '30' })}</SelectItem>
                  <SelectItem value="90">{t('settings.days', { n: '90' })}</SelectItem>
                  <SelectItem value="180">{t('settings.days', { n: '180' })}</SelectItem>
                  <SelectItem value="365">{t('settings.year')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.incidentLogs')}</label>
              <Select defaultValue="365">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">{t('settings.days', { n: '90' })}</SelectItem>
                  <SelectItem value="180">{t('settings.days', { n: '180' })}</SelectItem>
                  <SelectItem value="365">{t('settings.year')}</SelectItem>
                  <SelectItem value="forever">{t('settings.forever')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('settings.systemLogs')}</label>
              <Select defaultValue="30">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t('settings.days', { n: '7' })}</SelectItem>
                  <SelectItem value="30">{t('settings.days', { n: '30' })}</SelectItem>
                  <SelectItem value="90">{t('settings.days', { n: '90' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
