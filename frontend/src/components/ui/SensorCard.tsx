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

const STATUS_BORDER_STYLES = {
  optimal: 'border-b-[3px] border-b-primary shadow-sm shadow-primary/5',
  warning: 'border-b-[3px] border-b-orange-400 shadow-sm shadow-orange-400/5',
  danger:  'border-b-[3px] border-b-destructive shadow-sm shadow-destructive/5',
  info:    'border-b-[3px] border-b-blue-400 shadow-sm shadow-blue-400/5',
};

const BADGE_STYLES = {
  optimal: 'bg-primary/10 text-primary border border-primary/20',
  warning: 'bg-orange-400/10 text-orange-600 dark:text-orange-400 border border-orange-400/20',
  danger:  'bg-destructive/10 text-destructive border border-destructive/20',
  info:    'bg-blue-400/10 text-blue-600 dark:text-blue-400 border border-blue-400/20',
};

export default function SensorCard({
  label, value, unit, icon, status = 'info',
  statusLabel, trend, trendValue, loading,
}: SensorCardProps) {
  return (
    <Card className={cn("overflow-hidden group transition-all duration-300 hover:shadow-md", STATUS_BORDER_STYLES[status])}>
      <CardContent className={cn("p-5 h-full flex flex-col justify-between", loading && "animate-pulse")}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-2xl opacity-90 group-hover:scale-110 transition-transform duration-300 select-none">{icon}</div>
          {statusLabel && (
            <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', BADGE_STYLES[status])}>
              {statusLabel}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          {loading ? (
            <div className="h-9 w-24 bg-muted rounded-md" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tabular-nums tracking-tighter text-foreground">
                {value !== null && value !== undefined ? value.toFixed(unit === 'pH' ? 2 : 1) : '–'}
              </span>
              <span className="text-sm font-medium text-muted-foreground">{unit}</span>
            </div>
          )}
        </div>

        {/* Label */}
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>

        {/* Trend */}
        {trend && trendValue && !loading && (
          <div className="flex items-center gap-1 mt-3 text-xs font-medium text-muted-foreground/80">
            {trend === 'up'     && <TrendingUp  size={14} className="text-primary" />}
            {trend === 'down'   && <TrendingDown size={14} className="text-destructive" />}
            {trend === 'stable' && <Minus        size={14} className="text-primary/70" />}
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
