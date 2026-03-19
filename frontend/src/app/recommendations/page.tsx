'use client';

import { useQuery } from 'react-query';
import { Lightbulb, RefreshCw, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { recommendationsAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

const PRIORITY_CFG = {
  critical: { bg: 'bg-red-500/5 border-red-500/15 hover:border-red-500/30', badge: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: <XCircle size={18} className="text-red-500 flex-shrink-0" /> },
  high: { bg: 'bg-orange-500/5 border-orange-500/15 hover:border-orange-500/30', badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', icon: <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" /> },
  medium: { bg: 'bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', icon: <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" /> },
  low: { bg: 'bg-sky-500/5 border-sky-500/15 hover:border-sky-500/30', badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', icon: <Info size={18} className="text-sky-500 flex-shrink-0" /> },
  info: { bg: 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', icon: <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" /> },
} as const;
type PKey = keyof typeof PRIORITY_CFG;

interface Recommendation { id: string; priority: PKey; category: string; icon: string; title: string; message: string; action: string; }
interface Snapshot { moisture?: number; temperature?: number; humidity?: number; ph?: number; nitrogen?: number; phosphorus?: number; potassium?: number; }
interface ApiResponse { recommendations: Recommendation[]; sensor_snapshot?: Snapshot; last_updated?: string; }

export default function RecommendationsPage() {
  const { data, isLoading, error, refetch } = useQuery<ApiResponse>(
    'recommendations', () => recommendationsAPI.get().then((r) => r.data as ApiResponse), { refetchInterval: 2 * 60_000 }
  );

  const recs = data?.recommendations ?? [];
  const critical = recs.filter((r) => r.priority === 'critical').length;
  const high = recs.filter((r) => r.priority === 'high').length;
  const snap = data?.sensor_snapshot;

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Lightbulb size={26} className="text-emerald-500" /> AI Recommendations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Smart, actionable insights based on your farm&apos;s real-time data</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2 font-medium shadow-sm w-full sm:w-auto" disabled={isLoading}>
          <RefreshCw size={15} className={cn(isLoading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {/* Pills */}
      <div className="flex gap-2.5 mb-8 flex-wrap">
        {[
          { label: 'Active', count: recs.length, cls: 'bg-muted/50 text-foreground border-border/30' },
          { label: 'Critical', count: critical, cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-transparent' },
          { label: 'High', count: high, cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-transparent' },
        ].map((p) => (
          <div key={p.label} className={cn("px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", p.cls)}>
            <span className="text-sm mr-1">{p.count}</span> {p.label}
          </div>
        ))}
        {data?.last_updated && (
          <div className="px-3.5 py-1 rounded-full text-xs font-medium text-muted-foreground bg-background/60 border border-border/30 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Sync {formatDistanceToNow(new Date(data.last_updated), { addSuffix: true })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          {!!error && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 text-red-600 dark:text-red-400 font-medium text-sm flex items-center gap-2.5">
              <AlertTriangle size={16} /> Failed to load recommendations.
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
          ) : recs.length === 0 ? (
            <Card className="border-dashed bg-card/40">
              <CardContent className="text-center py-14 flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-3xl mb-4">✨</div>
                <p className="text-lg font-bold text-foreground">Farm is optimal!</p>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">No urgent interventions needed based on current sensor data.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recs.map((rec, i) => {
                const cfg = PRIORITY_CFG[rec.priority] ?? PRIORITY_CFG.info;
                return (
                  <div key={rec.id} className={cn("flex gap-4 p-5 rounded-xl border transition-all animate-slide-up relative overflow-hidden group", cfg.bg)}
                    style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="text-2xl flex-shrink-0 mt-0.5 bg-background/60 backdrop-blur-sm rounded-xl p-2 border border-border/20 h-fit">{rec.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                        <h3 className="font-bold text-foreground text-base tracking-tight">{rec.title}</h3>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-md tracking-wider", cfg.badge)}>{rec.category}</span>
                          <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-md tracking-wider border border-current/15", cfg.badge)}>{rec.priority}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{rec.message}</p>
                      <div className="flex items-center gap-2 mt-3 text-sm font-medium text-foreground bg-background/50 rounded-lg px-3 py-2 border border-border/20 w-fit">
                        {cfg.icon} <span className="text-emerald-600 dark:text-emerald-400">{rec.action}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-5">
          {isLoading && !snap ? (
             <Card><CardContent className="p-5"><Skeleton className="h-5 w-1/2 mb-3" /><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div></CardContent></Card>
          ) : snap && (
            <Card>
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Data Context
                </p>
                <div className="grid grid-cols-2 gap-2.5 text-sm">
                  {[
                    { label: 'Moisture', val: snap.moisture != null ? `${snap.moisture.toFixed(1)}%` : '–' },
                    { label: 'Temp', val: snap.temperature != null ? `${snap.temperature.toFixed(1)}°C` : '–' },
                    { label: 'Humidity', val: snap.humidity != null ? `${snap.humidity.toFixed(1)}%` : '–' },
                    { label: 'pH', val: snap.ph != null ? snap.ph.toFixed(2) : '–' },
                    { label: 'Nitrogen', val: snap.nitrogen != null ? `${snap.nitrogen.toFixed(0)}` : '–' },
                    { label: 'Phosphorus', val: snap.phosphorus != null ? `${snap.phosphorus.toFixed(0)}` : '–' },
                    { label: 'Potassium', val: snap.potassium != null ? `${snap.potassium.toFixed(0)}` : '–' },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted/20 rounded-lg p-2.5 border border-border/20 flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-0.5">{item.label}</span>
                      <span className="font-bold text-foreground">{item.val}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-emerald-500/5 border-emerald-500/15">
             <CardContent className="p-5">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2 text-sm">
                  <Lightbulb size={15} className="text-emerald-500" /> How it works
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PrithviCore AI analyzes live IoT metrics against crop-specific thresholds to generate these actionable recommendations.
                </p>
             </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
