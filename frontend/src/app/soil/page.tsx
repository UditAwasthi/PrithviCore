'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { subDays, format } from 'date-fns';
import { Leaf } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { sensorAPI } from '@/lib/api';
import { SoilTrendChart, NPKChart } from '@/components/charts/SoilChart';

const RANGES = [
  { label: '24h', days: 1  },
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
];

interface SensorRow {
  _id: string; timestamp: string;
  moisture: number; temperature: number; humidity: number;
  ph: number; nitrogen: number; phosphorus: number; potassium: number;
}

export default function SoilPage() {
  const [range, setRange] = useState(7);

  const { data, isLoading } = useQuery(
    ['soil-history', range],
    () => sensorAPI.history({
      from:  subDays(new Date(), range).toISOString(),
      to:    new Date().toISOString(),
      limit: 500,
    }).then((r) => r.data),
    { refetchInterval: 60_000 }
  );

  const { data: latestData } = useQuery('soil-latest', () =>
    sensorAPI.latest().then((r) => r.data)
  );

  const latest   = latestData as SensorRow | undefined;
  const daily    = (data as { daily_averages?: unknown[] })?.daily_averages ?? [];
  const readings = (data as { readings?: SensorRow[] })?.readings ?? [];

  const metrics = [
    { label: 'Moisture',    key: 'moisture',    unit: '%',     icon: '💧', decimals: 1 },
    { label: 'Temperature', key: 'temperature', unit: '°C',    icon: '🌡️', decimals: 1 },
    { label: 'Humidity',    key: 'humidity',    unit: '%',     icon: '🌫️', decimals: 1 },
    { label: 'pH',          key: 'ph',          unit: 'pH',    icon: '🧪', decimals: 2 },
    { label: 'Nitrogen',    key: 'nitrogen',    unit: 'mg/kg', icon: '🌿', decimals: 0 },
    { label: 'Phosphorus',  key: 'phosphorus',  unit: 'mg/kg', icon: '🌾', decimals: 0 },
    { label: 'Potassium',   key: 'potassium',   unit: 'mg/kg', icon: '🍂', decimals: 0 },
  ] as const;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-agri-700 flex items-center gap-2"><Leaf size={24} /> Soil Data</h1>
          <p className="text-sm text-gray-500 mt-1">Historical sensor readings and trends</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setRange(r.days)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                range === r.days ? 'bg-agri-600 text-white' : 'bg-white text-agri-600 border border-agri-200 hover:bg-agri-50'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current snapshot */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {metrics.map((m) => (
            <div key={m.key} className="bg-white rounded-2xl border border-agri-100 p-4 text-center shadow-sm">
              <div className="text-xl mb-1">{m.icon}</div>
              <div className="text-xl font-extrabold text-agri-700">
                {latest[m.key] != null ? (latest[m.key] as number).toFixed(m.decimals) : '–'}
                <span className="text-xs font-normal ml-0.5 text-gray-400">{m.unit}</span>
              </div>
              <div className="text-xs text-gray-400 font-medium mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-agri-100 p-5 shadow-sm">
          <h3 className="font-bold text-agri-700 mb-4">Moisture, Temperature &amp; pH</h3>
          {isLoading ? <Skeleton /> : daily.length > 0 ? <SoilTrendChart data={daily as Record<string, number | string>[]} height={260} /> : <EmptyState />}
        </div>
        <div className="bg-white rounded-2xl border border-agri-100 p-5 shadow-sm">
          <h3 className="font-bold text-agri-700 mb-4">NPK Levels</h3>
          {isLoading ? <Skeleton /> : daily.length > 0 ? <NPKChart data={daily as Record<string, number | string>[]} height={260} /> : <EmptyState />}
        </div>
      </div>

      {/* Raw readings table */}
      <div className="bg-white rounded-2xl border border-agri-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-agri-50">
          <h3 className="font-bold text-agri-700">Raw Readings ({readings.length})</h3>
          <span className="text-xs text-gray-400">Showing latest {Math.min(readings.length, 100)}</span>
        </div>
        {readings.length === 0 ? (
          <div className="py-12 text-center text-gray-300">No readings in this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-gray-50">
                  {['Timestamp','Moisture%','Temp°C','Humidity%','pH','N mg/kg','P mg/kg','K mg/kg'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {readings.slice(0, 100).map((r, i) => (
                  <tr key={r._id} className={`border-b border-gray-50 hover:bg-agri-50/30 transition-colors ${i % 2 ? 'bg-gray-50/30' : ''}`}>
                    <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{format(new Date(r.timestamp), 'MMM d, HH:mm')}</td>
                    <td className="px-4 py-2.5 font-semibold text-blue-700">{r.moisture?.toFixed(1)}</td>
                    <td className="px-4 py-2.5 font-semibold text-amber-700">{r.temperature?.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-gray-600">{r.humidity?.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-purple-700 font-semibold">{r.ph?.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-agri-700 font-semibold">{r.nitrogen?.toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-agri-600">{r.phosphorus?.toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-agri-500">{r.potassium?.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Skeleton() { return <div className="h-64 bg-agri-50 rounded-xl animate-pulse" />; }
function EmptyState() {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-gray-300">
      <span className="text-4xl mb-2">📊</span>
      <p className="text-sm">No data in this period yet</p>
    </div>
  );
}
