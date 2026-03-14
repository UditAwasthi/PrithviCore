'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { dashboardAPI, weatherAPI } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import AppLayout from '@/components/layout/AppLayout';
import SensorCard from '@/components/ui/SensorCard';
import { SoilTrendChart, NPKChart } from '@/components/charts/SoilChart';
import { formatDistanceToNow, format } from 'date-fns';
import { Droplets, Wind, Bug, Lightbulb, RefreshCw, Cloud } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SensorReading {
  moisture: number; temperature: number; humidity: number;
  ph: number; nitrogen: number; phosphorus: number; potassium: number;
  timestamp: string;
}
interface Recommendation { id: string; icon: string; title: string; action: string; priority: string; }
interface DiseaseResult  { disease_name: string; severity: string; confidence: number; treatment: string; }
interface DashboardData  {
  latest_reading: SensorReading | null;
  weekly_trend: Record<string, number | string>[];
  recommendations: Recommendation[];
  latest_disease: DiseaseResult | null;
}
interface WeatherCurrent { temperature: number; description: string; humidity: number; wind_speed: number; icon: string; city: string; }

function moistureStatus(v: number) {
  if (v < 20) return { status: 'danger'  as const, statusLabel: 'Critical Low' };
  if (v < 35) return { status: 'warning' as const, statusLabel: 'Low' };
  if (v > 70) return { status: 'warning' as const, statusLabel: 'Waterlogged' };
  return       { status: 'optimal' as const, statusLabel: 'Optimal' };
}
function tempStatus(v: number) {
  if (v > 35) return { status: 'danger'  as const, statusLabel: 'Heat Stress' };
  if (v < 10) return { status: 'warning' as const, statusLabel: 'Cold Risk' };
  return       { status: 'optimal' as const, statusLabel: 'Normal' };
}
function phStatus(v: number) {
  if (v < 5.5 || v > 8.0) return { status: 'danger'  as const, statusLabel: v < 5.5 ? 'Acidic' : 'Alkaline' };
  if (v < 6.0 || v > 7.5) return { status: 'warning' as const, statusLabel: 'Marginal' };
  return                    { status: 'optimal' as const, statusLabel: 'Optimal' };
}
function npkStatus(v: number, low: number) {
  if (v < low)       return { status: 'danger'  as const, statusLabel: 'Low' };
  if (v < low * 1.3) return { status: 'warning' as const, statusLabel: 'Marginal' };
  return              { status: 'optimal' as const, statusLabel: 'Good' };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: dash, isLoading, error, dataUpdatedAt } = useQuery<DashboardData>(
    'dashboard',
    () => dashboardAPI.get().then((r) => r.data as DashboardData),
    { refetchInterval: 60_000 }
  );

  const { data: weatherData } = useQuery<{ current?: WeatherCurrent }>(
    'weather',
    () => weatherAPI.get().then((r) => r.data as { current?: WeatherCurrent }),
    { refetchInterval: 10 * 60_000, staleTime: 5 * 60_000 }
  );

  const wsHandler = useCallback(
    (msg: { event: string }) => { if (msg.event === 'sensor_update') qc.invalidateQueries('dashboard'); },
    [qc]
  );
  useWebSocket(wsHandler);

  const s    = dash?.latest_reading ?? null;
  const wkly = dash?.weekly_trend   ?? [];
  const recs  = dash?.recommendations ?? [];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-agri-700">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
            {user?.name?.split(' ')[0] ?? 'Farmer'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.farm_location?.city
              ? `📍 ${user.farm_location.city}, ${user.farm_location.state ?? ''}`
              : 'Farm overview'}{' '}
            · {format(new Date(), 'EEEE, MMM d')}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries('dashboard')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-agri-600 hover:bg-agri-50 rounded-xl transition-colors border border-agri-200"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm font-medium">
          ⚠️ Could not load sensor data. Make sure the backend is running and your IoT device is connected.
        </div>
      )}

      {dataUpdatedAt > 0 && (
        <p className="text-xs text-gray-400 mb-4">
          Last updated: {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
          {s?.timestamp && ` · Sensor: ${formatDistanceToNow(new Date(s.timestamp), { addSuffix: true })}`}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SensorCard label="Soil Moisture" value={s?.moisture}    unit="%"  icon="💧" loading={isLoading} {...(s ? moistureStatus(s.moisture)    : { status: 'info' as const })} />
        <SensorCard label="Temperature"   value={s?.temperature} unit="°C" icon="🌡️" loading={isLoading} {...(s ? tempStatus(s.temperature)     : { status: 'info' as const })} />
        <SensorCard label="Humidity"      value={s?.humidity}    unit="%"  icon="🌫️" loading={isLoading}
          status={s ? (s.humidity > 85 ? 'warning' : 'info') : 'info'}
          statusLabel={s ? (s.humidity > 85 ? 'High' : 'Normal') : undefined}
        />
        <SensorCard label="Soil pH"       value={s?.ph}          unit="pH" icon="🧪" loading={isLoading} {...(s ? phStatus(s.ph)               : { status: 'info' as const })} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <SensorCard label="Nitrogen (N)"   value={s?.nitrogen}   unit="mg/kg" icon="🌿" loading={isLoading} {...(s ? npkStatus(s.nitrogen,   50) : { status: 'info' as const })} />
        <SensorCard label="Phosphorus (P)" value={s?.phosphorus} unit="mg/kg" icon="🌾" loading={isLoading} {...(s ? npkStatus(s.phosphorus, 25) : { status: 'info' as const })} />
        <SensorCard label="Potassium (K)"  value={s?.potassium}  unit="mg/kg" icon="🍂" loading={isLoading} {...(s ? npkStatus(s.potassium,  30) : { status: 'info' as const })} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-agri-100 p-5 shadow-sm">
          <h3 className="font-bold text-agri-700 mb-4">7-Day Soil Trend</h3>
          {wkly.length > 0 ? <SoilTrendChart data={wkly} /> : <EmptyChart message="No history yet — sensor data will appear here" />}
        </div>
        <div className="bg-white rounded-2xl border border-agri-100 p-5 shadow-sm">
          <h3 className="font-bold text-agri-700 mb-4">NPK Levels (7 Days)</h3>
          {wkly.length > 0 ? <NPKChart data={wkly} /> : <EmptyChart message="Historical NPK data will appear here" />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WeatherCard current={weatherData?.current} />

        <div className="bg-white rounded-2xl border border-agri-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-agri-700 flex items-center gap-2"><Lightbulb size={16} /> Recommendations</h3>
            <Link href="/recommendations" className="text-xs text-agri-500 hover:underline font-medium">View all →</Link>
          </div>
          <div className="space-y-2">
            {recs.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Connect a sensor to get recommendations</p>
            ) : recs.slice(0, 3).map((r) => (
              <div key={r.id} className={`flex gap-3 p-3 rounded-xl text-sm ${
                r.priority === 'critical' ? 'bg-red-50' : r.priority === 'high' ? 'bg-amber-50' :
                r.priority === 'medium'   ? 'bg-blue-50' : 'bg-agri-50'}`}>
                <span className="text-lg flex-shrink-0">{r.icon}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-xs">{r.title}</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">{r.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-agri-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-agri-700 flex items-center gap-2"><Bug size={16} /> Latest Detection</h3>
            <Link href="/disease" className="text-xs text-agri-500 hover:underline font-medium">Detect →</Link>
          </div>
          {dash?.latest_disease ? (
            <div className="space-y-3">
              <div className={`p-3 rounded-xl text-sm font-semibold ${
                dash.latest_disease.severity === 'critical' ? 'bg-red-50 text-red-700' :
                dash.latest_disease.severity === 'high'     ? 'bg-orange-50 text-orange-700' : 'bg-agri-50 text-agri-700'}`}>
                {dash.latest_disease.disease_name}
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Confidence: <span className="font-semibold text-gray-700">{(dash.latest_disease.confidence * 100).toFixed(0)}%</span></p>
                <p>Severity: <span className="font-semibold text-gray-700 capitalize">{dash.latest_disease.severity}</span></p>
                <p className="text-gray-400 italic mt-2">{dash.latest_disease.treatment}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">📷</div>
              <p className="text-sm text-gray-400">Upload a leaf photo to detect diseases</p>
              <Link href="/disease">
                <button className="mt-3 px-4 py-1.5 bg-agri-500 text-white text-xs font-semibold rounded-full hover:bg-agri-600 transition-colors">
                  Try Detection
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[260px] flex flex-col items-center justify-center text-gray-300 text-sm font-medium gap-2">
      <span className="text-3xl">📊</span>
      {message}
    </div>
  );
}

function WeatherCard({ current: c }: { current?: WeatherCurrent }) {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white shadow-sm">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-white/80"><Cloud size={16} /> Weather</h3>
      {c ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            <Image src={`https://openweathermap.org/img/wn/${c.icon}@2x.png`} alt={c.description} width={56} height={56} unoptimized />
            <div>
              <div className="text-4xl font-black">{c.temperature.toFixed(0)}°C</div>
              <div className="text-sm capitalize text-white/80">{c.description}</div>
            </div>
          </div>
          <div className="text-xs font-medium text-white/70 mb-2">{c.city}</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/15 rounded-lg p-2">
              <Droplets size={11} className="inline mr-1" />Humidity
              <div className="font-bold text-base mt-0.5">{c.humidity}%</div>
            </div>
            <div className="bg-white/15 rounded-lg p-2">
              <Wind size={11} className="inline mr-1" />Wind
              <div className="font-bold text-base mt-0.5">{c.wind_speed} m/s</div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-6 text-white/60 text-sm">
          <Cloud size={28} className="mx-auto mb-2 opacity-50" />
          Configure farm location to see weather
        </div>
      )}
    </div>
  );
}
