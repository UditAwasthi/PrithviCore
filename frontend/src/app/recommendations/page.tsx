'use client';

import { useQuery } from 'react-query';
import { Lightbulb, RefreshCw, AlertTriangle, Info, CheckCircle, XCircle, Brain, Droplets, Zap, Activity } from 'lucide-react';
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
interface AiAnalysis {
  status: 'normal' | 'warning' | 'critical' | 'insufficient_data';
  irrigation: 'on' | 'off' | 'monitor';
  soil?: { moisture?: string; ph?: string; npk?: string };
  actions?: string[];
  alerts?: string[];
  confidence?: 'low' | 'medium' | 'high';
}
interface ApiResponse { recommendations: Recommendation[]; ai_analysis?: AiAnalysis | null; sensor_snapshot?: Snapshot; last_updated?: string; }

const STATUS_STYLE = {
  normal:   { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', label: '✅ Normal' },
  warning:  { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', label: '⚠️ Warning' },
  critical: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-600 dark:text-red-400', label: '🚨 Critical' },
  insufficient_data: { bg: 'bg-muted/30 border-border/30', text: 'text-muted-foreground', label: '📡 Awaiting Data' },
} as const;

const IRRIGATION_STYLE = {
  on:      { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: <Droplets size={14} className="text-blue-500" />, label: 'Irrigate Now' },
  off:     { bg: 'bg-muted/30', text: 'text-muted-foreground', icon: <Droplets size={14} className="text-muted-foreground" />, label: 'No Irrigation' },
  monitor: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: <Activity size={14} className="text-amber-500" />, label: 'Monitor' },
} as const;

export default function RecommendationsPage() {
  const { data, isLoading, error, refetch } = useQuery<ApiResponse>(
    'recommendations', () => recommendationsAPI.get().then((r) => r.data as ApiResponse), { refetchInterval: 2 * 60_000 }
  );

  const recs = data?.recommendations ?? [];
  const critical = recs.filter((r) => r.priority === 'critical').length;
  const high = recs.filter((r) => r.priority === 'high').length;
  const snap = data?.sensor_snapshot;
  const ai = data?.ai_analysis;

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
          {/* AI Decision Engine Card */}
          {ai && ai.status !== 'insufficient_data' && (
            <Card className="overflow-hidden border-0 ring-1 ring-violet-500/20 bg-gradient-to-br from-violet-500/5 via-background to-indigo-500/5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Brain size={13} className="text-violet-500" /> AI Analysis
                  </p>
                  <span className={cn("text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider border", STATUS_STYLE[ai.status]?.bg, STATUS_STYLE[ai.status]?.text)}>
                    {STATUS_STYLE[ai.status]?.label}
                  </span>
                </div>

                {/* Irrigation Decision */}
                {ai.irrigation && (
                  <div className={cn("flex items-center gap-2.5 p-3 rounded-xl border border-border/20 mb-3", IRRIGATION_STYLE[ai.irrigation]?.bg)}>
                    {IRRIGATION_STYLE[ai.irrigation]?.icon}
                    <div>
                      <span className={cn("text-xs font-bold uppercase tracking-wider", IRRIGATION_STYLE[ai.irrigation]?.text)}>
                        Irrigation: {IRRIGATION_STYLE[ai.irrigation]?.label}
                      </span>
                    </div>
                  </div>
                )}

                {/* Soil Status */}
                {ai.soil && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Moisture', val: ai.soil.moisture },
                      { label: 'pH', val: ai.soil.ph },
                      { label: 'NPK', val: ai.soil.npk },
                    ].filter(s => s.val).map((s) => (
                      <div key={s.label} className="bg-background/60 rounded-lg p-2 border border-border/20 text-center">
                        <span className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground block">{s.label}</span>
                        <span className={cn("text-xs font-bold capitalize",
                          s.val === 'optimal' ? 'text-emerald-600 dark:text-emerald-400' :
                          s.val === 'low' || s.val === 'acidic' ? 'text-red-600 dark:text-red-400' :
                          'text-amber-600 dark:text-amber-400'
                        )}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {ai.actions && ai.actions.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
                      <Zap size={10} /> Actions
                    </span>
                    {ai.actions.map((a, i) => (
                      <div key={i} className="text-xs text-foreground bg-background/50 rounded-lg px-3 py-2 border border-border/15 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">▸</span> {a}
                      </div>
                    ))}
                  </div>
                )}

                {/* Alerts */}
                {ai.alerts && ai.alerts.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-red-500 flex items-center gap-1">
                      <AlertTriangle size={10} /> Alerts
                    </span>
                    {ai.alerts.map((a, i) => (
                      <div key={i} className="text-xs text-red-600 dark:text-red-400 bg-red-500/5 rounded-lg px-3 py-2 border border-red-500/10">
                        {a}
                      </div>
                    ))}
                  </div>
                )}

                {/* Confidence */}
                {ai.confidence && (
                  <div className="mt-3 pt-3 border-t border-border/20 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Confidence</span>
                    <span className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                      ai.confidence === 'high' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      ai.confidence === 'medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                      'bg-muted/50 text-muted-foreground'
                    )}>{ai.confidence}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sensor Data Context */}
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
                  PrithviCore combines rule-based thresholds with AI-powered analysis of your live IoT sensor data to generate actionable farming recommendations.
                </p>
             </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
