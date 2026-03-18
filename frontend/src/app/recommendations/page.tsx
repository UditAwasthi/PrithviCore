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
  critical: { bg: 'bg-destructive/5 border-destructive/20 hover:border-destructive/40', badge: 'bg-destructive/10 text-destructive', icon: <XCircle size={20} className="text-destructive flex-shrink-0" /> },
  high: { bg: 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40', badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', icon: <AlertTriangle size={20} className="text-orange-500 flex-shrink-0" /> },
  medium: { bg: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', icon: <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" /> },
  low: { bg: 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: <Info size={20} className="text-blue-500 flex-shrink-0" /> },
  info: { bg: 'bg-primary/5 border-primary/20 hover:border-primary/40', badge: 'bg-primary/10 text-primary', icon: <CheckCircle size={20} className="text-primary flex-shrink-0" /> },
} as const;
type PKey = keyof typeof PRIORITY_CFG;

interface Recommendation {
  id: string; priority: PKey; category: string; icon: string; title: string; message: string; action: string;
}
interface Snapshot { moisture?: number; temperature?: number; humidity?: number; ph?: number; nitrogen?: number; phosphorus?: number; potassium?: number; }
interface ApiResponse { recommendations: Recommendation[]; sensor_snapshot?: Snapshot; last_updated?: string; }

export default function RecommendationsPage() {
  const { data, isLoading, error, refetch } = useQuery<ApiResponse>(
    'recommendations',
    () => recommendationsAPI.get().then((r) => r.data as ApiResponse),
    { refetchInterval: 2 * 60_000 }
  );

  const recs = data?.recommendations ?? [];
  const critical = recs.filter((r) => r.priority === 'critical').length;
  const high = recs.filter((r) => r.priority === 'high').length;
  const snap = data?.sensor_snapshot;

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Lightbulb size={28} className="text-primary" /> AI Recommendations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Smart, actionable insights based on your farm's real-time data</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2 font-semibold shadow-sm w-full sm:w-auto" disabled={isLoading}>
          <RefreshCw size={16} className={cn(isLoading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {[
          { label: 'Total active', count: recs.length, color: 'bg-muted text-foreground border-border' },
          { label: 'Critical', count: critical, color: 'bg-destructive/10 text-destructive border-transparent' },
          { label: 'High Priority', count: high, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-transparent' },
        ].map((p) => (
          <div key={p.label} className={cn("px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border", p.color)}>
            <span className="text-sm mr-1">{p.count}</span> {p.label}
          </div>
        ))}
        {data?.last_updated && (
          <div className="px-4 py-1.5 rounded-full text-xs font-bold text-muted-foreground bg-background border border-border flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary block animate-pulse"></span>
            Sync {formatDistanceToNow(new Date(data.last_updated), { addSuffix: true })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Recommendations */}
        <div className="lg:col-span-2 space-y-4">
          {!!error && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-destructive font-medium text-sm flex items-center gap-3">
              <AlertTriangle size={18} />
              <p>Failed to load recommendations. Ensure the backend AI engine is reachable.</p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
               {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
          ) : recs.length === 0 ? (
            <Card className="shadow-sm border-dashed border-border bg-card/50">
              <CardContent className="text-center py-16 flex flex-col items-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner">✨</div>
                <p className="text-xl font-bold text-foreground">Farm is absolutely optimal!</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">Your crops are thriving. No urgent interventions are required at this time based on current sensor data.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recs.map((rec, i) => {
                const cfg = PRIORITY_CFG[rec.priority] ?? PRIORITY_CFG.info;
                return (
                  <div key={rec.id} className={cn("flex gap-5 p-6 rounded-2xl border shadow-sm transition-all animate-slide-up relative overflow-hidden group", cfg.bg)}
                    style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="text-3xl flex-shrink-0 mt-1 bg-background rounded-full p-2 shadow-sm border border-border/50">{rec.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <h3 className="font-bold text-foreground text-lg tracking-tight">{rec.title}</h3>
                        <div className="flex gap-2 flex-shrink-0">
                          <span className={cn("text-[10px] uppercase font-black px-2.5 py-1 rounded-md tracking-widest", cfg.badge)}>{rec.category}</span>
                          <span className={cn("text-[10px] uppercase font-black px-2.5 py-1 rounded-md tracking-widest border border-current/20", cfg.badge)}>{rec.priority}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium">{rec.message}</p>
                      <div className="flex items-center gap-2 mt-4 text-sm font-bold text-foreground bg-background/60 rounded-lg px-4 py-2.5 border border-border/50 shadow-sm w-fit group-hover:bg-background transition-colors">
                        {cfg.icon} Action: <span className="text-primary">{rec.action}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Context / Sandbox info */}
        <div className="lg:col-span-1 space-y-6">
          {isLoading && !snap ? (
             <Card className="shadow-sm">
               <CardContent className="p-5">
                 <Skeleton className="h-6 w-1/2 mb-4" />
                 <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>
               </CardContent>
             </Card>
          ) : snap && (
            <Card className="shadow-sm border-border">
              <CardContent className="p-5">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary block"/> Data Context
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Moisture', val: snap.moisture != null ? `${snap.moisture.toFixed(1)}%` : '–' },
                    { label: 'Temp', val: snap.temperature != null ? `${snap.temperature.toFixed(1)}°C` : '–' },
                    { label: 'Humidity', val: snap.humidity != null ? `${snap.humidity.toFixed(1)}%` : '–' },
                    { label: 'pH Level', val: snap.ph != null ? snap.ph.toFixed(2) : '–' },
                    { label: 'Nitrogen', val: snap.nitrogen != null ? `${snap.nitrogen.toFixed(0)}` : '–' },
                    { label: 'Phosphorus', val: snap.phosphorus != null ? `${snap.phosphorus.toFixed(0)}` : '–' },
                    { label: 'Potassium', val: snap.potassium != null ? `${snap.potassium.toFixed(0)}` : '–' },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted/30 rounded-xl p-3 border border-border/50 flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">{item.label}</span> 
                      <span className="font-extrabold text-foreground">{item.val}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-primary/5 border-primary/20 shadow-sm">
             <CardContent className="p-5">
                <h4 className="font-bold text-foreground flex items-center gap-2 mb-2">
                  <Lightbulb size={16} className="text-primary" /> How it works
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  PrithviCore AI constantly analyzes the live stream of IoT metrics against crop-specific thresholds to generate these actionable tasks.
                </p>
             </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
