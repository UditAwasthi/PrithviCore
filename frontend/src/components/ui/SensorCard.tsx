'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface SensorCardProps {
  label: string;
  value: number | null | undefined;
  unit: string;
  icon: string;
  status?: 'optimal' | 'warning' | 'danger' | 'info';
  statusLabel?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  loading?: boolean;
}

const STATUS_CONFIG = {
  optimal: {
    border: 'border-l-4 border-l-emerald-500',
    glow: 'shadow-emerald-500/10',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  warning: {
    border: 'border-l-4 border-l-amber-500',
    glow: 'shadow-amber-500/10',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    dot: 'bg-amber-500',
  },
  danger: {
    border: 'border-l-4 border-l-red-500',
    glow: 'shadow-red-500/10',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
    dot: 'bg-red-500',
  },
  info: {
    border: 'border-l-4 border-l-sky-500',
    glow: 'shadow-sky-500/10',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
    dot: 'bg-sky-500',
  },
};

export default function SensorCard({
  label, value, unit, icon, status = 'info',
  statusLabel, trend, trendValue, loading,
}: SensorCardProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <Card className={cn("overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 relative", cfg.border, cfg.glow)}>
      {/* Subtle radial glow behind icon */}
      <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none -translate-y-1/3 translate-x-1/3", cfg.dot)} />

      <CardContent className={cn("p-5 h-full flex flex-col justify-between relative z-10", loading && "animate-pulse")}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-2xl select-none bg-background/60 backdrop-blur-sm p-2.5 rounded-xl shadow-sm border border-border/30 group-hover:scale-110 transition-transform duration-300">{icon}</div>
          {statusLabel && (
            <span className={cn('text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full', cfg.badge)}>
              {statusLabel}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="mb-1.5">
          {loading ? (
            <div className="h-10 w-28 bg-muted rounded-lg" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black tabular-nums tracking-tighter text-foreground">
                {value !== null && value !== undefined ? value.toFixed(unit === 'pH' ? 2 : 1) : '–'}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">{unit}</span>
            </div>
          )}
        </div>

        {/* Background Sparkline */}
        <svg className="absolute bottom-0 left-0 w-full h-1/2 opacity-[0.04] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 50">
          <path d="M0,50 L0,30 C20,20 40,40 60,10 C80,-10 90,20 100,5 L100,50 Z" fill="currentColor" />
        </svg>

        {/* Label */}
        <p className="text-sm font-medium text-muted-foreground">{label}</p>

        {/* Trend */}
        {trend && trendValue && !loading && (
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-muted-foreground/80">
            {trend === 'up'     && <TrendingUp  size={14} className="text-emerald-500" />}
            {trend === 'down'   && <TrendingDown size={14} className="text-red-500" />}
            {trend === 'stable' && <Minus        size={14} className="text-sky-500" />}
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
