'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import {
  ActivitySquare, Search, Filter, Clock, User,
  Database, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogEntry = Record<string, any>;

const eventStyle: Record<string, { color: string; bg: string }> = {
  created: { color: 'text-emerald-500', bg: 'bg-emerald-500' },
  updated: { color: 'text-blue-500', bg: 'bg-blue-500' },
  deleted: { color: 'text-rose-500', bg: 'bg-rose-500' },
  default: { color: 'text-slate-400', bg: 'bg-slate-400' },
};

export default function LogsPage() {
  const { t, locale } = useTranslation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/logs?per_page=50');
        if (res.data?.data) setLogs(res.data.data);
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filtered = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.description || '').toLowerCase().includes(q) ||
      (log.causer?.name || '').toLowerCase().includes(q) ||
      (log.event || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <ActivitySquare className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('logs.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading ? t('common.loading') : t('logs.entriesCount', { count: logs.length })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {['created', 'updated', 'deleted'].map(event => {
            const count = logs.filter(l => l.event === event).length;
            const style = eventStyle[event];
            return (
              <Badge key={event} variant="outline" className={`text-[10px] uppercase tracking-wider gap-1 ${style.color}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${style.bg}`} /> {count}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('logs.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/80 backdrop-blur-md"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      )}

      {/* Log Entries */}
      {!loading && (
        <Card className="bg-card/40 backdrop-blur-xl shadow-2xl border-border/80">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {filtered.map((log) => {
                const style = eventStyle[log.event] || eventStyle.default;
                return (
                  <div key={log.id} className="p-4 hover:bg-accent/30 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${style.bg}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{log.description || t('logs.activity')}</p>
                          <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider ${style.color}`}>
                            {t(`logs.${log.event}`) || log.event || log.log_name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-[11px] text-muted-foreground font-medium flex-wrap">
                          {log.causer && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {log.causer.name || log.causer.email}
                            </span>
                          )}
                          {log.subject_type && (
                            <span className="flex items-center gap-1">
                              <Database className="w-3 h-3" /> {log.subject_type.split('\\').pop()} #{log.subject_id}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(log.created_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="p-16 text-center text-muted-foreground">
                  <ActivitySquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{t('logs.noEntries')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
