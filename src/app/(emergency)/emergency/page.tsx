'use client';

import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n';
import { AlertTriangle, Radio, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TrafficMap = dynamic(() => import('@/components/TrafficMap'), { ssr: false });

export default function EmergencyMapPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-rose-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-inner animate-pulse">
            <Radio className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('emergency.situationMap')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {t('emergency.situationMapDesc')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 border text-[10px] uppercase tracking-wider gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> 3 {t('emergency.active')}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" /> {t('emergency.live')}
          </Badge>
        </div>
      </div>

      {/* Full Map */}
      <Card className="bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden border-rose-500/10">
        <CardContent className="p-3">
          <div className="h-[calc(100vh-260px)] rounded-xl overflow-hidden border border-border/50">
            <TrafficMap />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
