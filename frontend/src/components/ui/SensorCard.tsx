'use client';

import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

const STATUS_STYLES = {
  optimal: 'bg-agri-50 border-agri-200 text-agri-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  danger:  'bg-red-50  border-red-200  text-red-700',
  info:    'bg-blue-50 border-blue-200 text-blue-700',
};

const BADGE_STYLES = {
  optimal: 'bg-agri-100  text-agri-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100   text-red-700',
  info:    'bg-blue-100  text-blue-700',
};

export default function SensorCard({
  label, value, unit, icon, status = 'info',
  statusLabel, trend, trendValue, loading,
}: SensorCardProps) {
  return (
    <div className={clsx(
      'rounded-2xl border p-5 transition-all duration-300 hover:shadow-md',
      STATUS_STYLES[status],
      loading && 'animate-pulse'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{icon}</div>
        {statusLabel && (
          <span className={clsx('text-[11px] font-bold px-2.5 py-1 rounded-full', BADGE_STYLES[status])}>
            {statusLabel}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mb-1">
        {loading ? (
          <div className="h-9 w-24 bg-current/20 rounded-lg" />
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tabular-nums leading-none">
              {value !== null && value !== undefined ? value.toFixed(unit === 'pH' ? 2 : 1) : '–'}
            </span>
            <span className="text-base font-medium opacity-70">{unit}</span>
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-sm font-semibold opacity-80">{label}</p>

      {/* Trend */}
      {trend && trendValue && !loading && (
        <div className="flex items-center gap-1 mt-2 text-xs font-medium opacity-70">
          {trend === 'up'     && <TrendingUp  size={12} />}
          {trend === 'down'   && <TrendingDown size={12} />}
          {trend === 'stable' && <Minus        size={12} />}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}
