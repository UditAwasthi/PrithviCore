'use client';

import { useQuery } from 'react-query';
import { Lightbulb, RefreshCw, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { recommendationsAPI } from '@/lib/api';

const PRIORITY_CFG = {
  critical: { bg: 'bg-red-50 border-red-200',     badge: 'bg-red-100 text-red-700',      icon: <XCircle      size={18} className="text-red-500 flex-shrink-0" /> },
  high:     { bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" /> },
  medium:   { bg: 'bg-amber-50 border-amber-200',  badge: 'bg-amber-100 text-amber-700',  icon: <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" /> },
  low:      { bg: 'bg-blue-50 border-blue-200',    badge: 'bg-blue-100 text-blue-700',    icon: <Info          size={18} className="text-blue-500 flex-shrink-0" /> },
  info:     { bg: 'bg-agri-50 border-agri-200',    badge: 'bg-agri-100 text-agri-700',   icon: <CheckCircle   size={18} className="text-agri-500 flex-shrink-0" /> },
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

  const recs     = data?.recommendations ?? [];
  const critical = recs.filter((r) => r.priority === 'critical').length;
  const high     = recs.filter((r) => r.priority === 'high').length;
  const snap     = data?.sensor_snapshot;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-agri-700 flex items-center gap-2"><Lightbulb size={24} /> Farm Recommendations</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered suggestions based on your latest sensor readings</p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-agri-600 hover:bg-agri-50 rounded-xl transition-colors border border-agri-200">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { label: 'Total',         count: recs.length, color: 'bg-gray-100 text-gray-700' },
          { label: 'Critical',      count: critical,    color: 'bg-red-100 text-red-700' },
          { label: 'High Priority', count: high,        color: 'bg-orange-100 text-orange-700' },
        ].map((p) => (
          <div key={p.label} className={`px-4 py-1.5 rounded-full text-sm font-bold ${p.color}`}>
            {p.count} {p.label}
          </div>
        ))}
        {data?.last_updated && (
          <div className="px-4 py-1.5 rounded-full text-sm text-gray-400 bg-gray-50">
            Updated {formatDistanceToNow(new Date(data.last_updated), { addSuffix: true })}
          </div>
        )}
      </div>

      {/* Sensor snapshot */}
      {snap && (
        <div className="bg-agri-50 border border-agri-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold text-agri-600 uppercase tracking-wide mb-2">Sensor Snapshot</p>
          <div className="flex gap-3 flex-wrap text-sm">
            {[
              { label: 'Moisture',    val: snap.moisture    != null ? `${snap.moisture.toFixed(1)}%`     : '–' },
              { label: 'Temperature', val: snap.temperature != null ? `${snap.temperature.toFixed(1)}°C` : '–' },
              { label: 'Humidity',    val: snap.humidity    != null ? `${snap.humidity.toFixed(1)}%`     : '–' },
              { label: 'pH',          val: snap.ph          != null ? snap.ph.toFixed(2)                 : '–' },
              { label: 'N',           val: snap.nitrogen    != null ? `${snap.nitrogen.toFixed(0)} mg/kg`    : '–' },
              { label: 'P',           val: snap.phosphorus  != null ? `${snap.phosphorus.toFixed(0)} mg/kg`  : '–' },
              { label: 'K',           val: snap.potassium   != null ? `${snap.potassium.toFixed(0)} mg/kg`   : '–' },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-lg px-3 py-1.5 text-gray-700 border border-agri-100 text-xs">
                <span className="text-agri-500 font-semibold">{item.label}:</span> {item.val}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          ⚠️ Failed to load recommendations. Ensure the backend and sensors are connected.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">{[1,2,3,4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : recs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-agri-100">
          <div className="text-5xl mb-4">🌱</div>
          <p className="text-lg font-bold text-agri-700">All systems look good!</p>
          <p className="text-sm text-gray-400 mt-2">No urgent recommendations at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recs.map((rec, i) => {
            const cfg = PRIORITY_CFG[rec.priority] ?? PRIORITY_CFG.info;
            return (
              <div key={rec.id} className={`flex gap-4 p-5 rounded-2xl border animate-slide-up ${cfg.bg}`}
                style={{ animationDelay: `${i * 40}ms` }}>
                <div className="text-2xl flex-shrink-0 mt-0.5">{rec.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h3 className="font-bold text-gray-800">{rec.title}</h3>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>{rec.category}</span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${cfg.badge}`}>{rec.priority}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1.5">{rec.message}</p>
                  <div className="flex items-center gap-2 mt-3 text-sm font-semibold text-gray-700">
                    {cfg.icon} <span>Action: {rec.action}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
