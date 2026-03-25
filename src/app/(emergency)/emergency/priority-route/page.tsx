'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n';
import {
  Route, MapPin, Navigation, Clock, AlertTriangle,
  Play, CheckCircle2, Ambulance, Truck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const TrafficMap = dynamic(() => import('@/components/TrafficMap'), { ssr: false });

export default function PriorityRoutePage() {
  const { t } = useTranslation();
  const [isRequesting, setIsRequesting] = useState(false);
  const [routeActive, setRouteActive] = useState(false);

  const handleRequest = () => {
    setIsRequesting(true);
    setTimeout(() => {
      setIsRequesting(false);
      setRouteActive(true);
    }, 2500);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-rose-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Route className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('emergency.priorityRoute')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('emergency.priorityRouteDesc')}
            </p>
          </div>
        </div>
        {routeActive && (
          <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] uppercase tracking-wider gap-1.5 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('emergency.routeActive')}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request Form */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-500" />
                {t('emergency.routeRequest')}
              </CardTitle>
              <CardDescription>{t('emergency.routeRequestDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('emergency.vehicleType')}</label>
                <Select defaultValue="ambulance">
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambulance">{t('emergency.ambulance')}</SelectItem>
                    <SelectItem value="fire_truck">{t('emergency.fireTruck')}</SelectItem>
                    <SelectItem value="police">{t('emergency.policeVehicle')}</SelectItem>
                    <SelectItem value="rescue">{t('emergency.rescueTeam')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('emergency.origin')}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <Input placeholder={t('emergency.originPlaceholder')} className="pl-10 bg-background/50" defaultValue="BV Da Nang, Q. Hai Chau" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('emergency.destination')}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                  <Input placeholder={t('emergency.destinationPlaceholder')} className="pl-10 bg-background/50" defaultValue="Cau Rong, Q. Son Tra" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('emergency.priorityLevel')}</label>
                <Select defaultValue="emergency">
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">{t('emergency.codeRed')}</SelectItem>
                    <SelectItem value="emergency">{t('emergency.emergencyUrgent')}</SelectItem>
                    <SelectItem value="standard">{t('emergency.standardPriority')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleRequest}
                disabled={isRequesting || routeActive}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 mt-2"
              >
                {isRequesting ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('emergency.requesting')}</span>
                ) : routeActive ? (
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {t('emergency.routeActivated')}</span>
                ) : (
                  <span className="flex items-center gap-2"><Play className="w-4 h-4" /> {t('emergency.requestPriorityRoute')}</span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Route Info (visible when active) */}
          {routeActive && (
            <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-emerald-500/30 animate-in slide-in-from-bottom-4 duration-500">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold text-sm text-emerald-500">{t('emergency.routeApproved')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background/50 p-3 rounded-lg border border-border/50 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('emergency.eta')}</p>
                    <p className="text-xl font-heading font-black text-blue-500">12 <span className="text-xs font-normal text-muted-foreground">min</span></p>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg border border-border/50 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('emergency.distance')}</p>
                    <p className="text-xl font-heading font-black text-amber-500">8.4 <span className="text-xs font-normal text-muted-foreground">km</span></p>
                  </div>
                </div>
                <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('emergency.signalsCleared')}</p>
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                    ))}
                    <span className="text-xs font-semibold text-emerald-500 ml-1">{t('emergency.intersections', { n: '6' })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Map */}
        <div className="lg:col-span-8">
          <Card className="bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden border-border/80">
            <CardContent className="p-3">
              <div className="h-[calc(100vh-260px)] rounded-xl overflow-hidden border border-border/50 relative">
                <TrafficMap />
                {isRequesting && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                    <div className="w-16 h-16 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                    <div className="text-center">
                      <p className="font-heading font-bold text-lg">{t('emergency.computingRoute')}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t('emergency.clearingSignals')}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
