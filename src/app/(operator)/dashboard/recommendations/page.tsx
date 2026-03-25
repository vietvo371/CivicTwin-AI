'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { Lightbulb, Check, X, Clock, Shield, Route, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Recommendation {
  id: number;
  incident_id: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

const typeIcons: Record<string, typeof Shield> = {
  priority_route: Shield, 
  reroute: Route, 
  alert: Bell,
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: 'outline', approved: 'default', rejected: 'destructive', executed: 'secondary',
};

export default function RecommendationsPage() {
  const { t, locale } = useTranslation();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recommendations');
      setRecs(res.data.data || []);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchRecs(); }, []);

  const handleApprove = async (id: number) => {
    await api.patch(`/recommendations/${id}/approve`);
    fetchRecs();
  };

  const handleReject = async () => {
    if (!rejectId || !reason) return;
    await api.patch(`/recommendations/${rejectId}/reject`, { reason });
    setRejectId(null);
    setReason('');
    fetchRecs();
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Lightbulb className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.opDecisions')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('op.opDecisionsDesc')}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="p-16 text-center border-dashed">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            <span className="font-medium text-muted-foreground animate-pulse">{t('op.fetchingRecs')}</span>
          </div>
        </Card>
      ) : recs.length === 0 ? (
        <Card className="p-16 text-center border-dashed">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-2">
              <Check className="w-6 h-6 text-emerald-500 opacity-50" />
            </div>
            <p className="font-medium text-lg">{t('op.allCaughtUp')}</p>
            <p className="text-sm text-muted-foreground">{t('op.noPendingRecs')}</p>
          </div>
        </Card>
      ) : (
        <Card className="bg-card/50 backdrop-blur-xl border-border/80 overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">{t('op.id')}</TableHead>
                <TableHead className="w-[160px]">{t('op.incidentType')}</TableHead>
                <TableHead>{t('op.description')}</TableHead>
                <TableHead className="w-[120px]">{t('op.status')}</TableHead>
                <TableHead className="w-[180px]">{t('op.createdAt')}</TableHead>
                <TableHead className="text-right w-[160px]">{t('op.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recs.map((rec) => {
                const Icon = typeIcons[rec.type] || Lightbulb;
                return (
                  <TableRow key={rec.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">#{rec.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-secondary/50 text-primary shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-xs tracking-wide uppercase">
                          {t(`enums.recommendationType.${rec.type}`)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm line-clamp-2" title={rec.description}>
                        {rec.description}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-1 uppercase tracking-widest">
                        {t('op.correlatedIncident')}: <span className="text-primary/80">#{rec.incident_id}</span>
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[rec.status] || 'outline'} className="uppercase tracking-wider text-[10px]">
                        {t(`enums.recommendationStatus.${rec.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {new Date(rec.created_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-middle">
                      {rec.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => setRejectId(rec.id)}
                          >
                            <X className="w-4 h-4 mr-1" /> {t('op.decline')}
                          </Button>
                          <Button 
                            size="sm"
                            className="h-8 bg-emerald-500 hover:bg-emerald-600 shadow-sm shrink-0"
                            onClick={() => handleApprove(rec.id)}
                          >
                            <Check className="w-4 h-4 mr-1" /> {t('op.approve')}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic flex items-center justify-end h-8">
                          {t('op.processed')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-destructive" />
              {t('op.declineRec')}
            </DialogTitle>
            <DialogDescription>
              {t('op.declineRecDesc')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder={t('op.reasonPlaceholder')}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="secondary" onClick={() => { setRejectId(null); setReason(''); }}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!reason}>
              {t('op.confirmDecline')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
