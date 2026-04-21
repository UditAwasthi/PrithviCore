'use client';

import { useCallback, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import dynamic from 'next/dynamic';
import { dashboardAPI } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import AppLayout from '@/components/layout/AppLayout';
import SensorCard from '@/components/ui/SensorCard';
import { formatDistanceToNow, format } from 'date-fns';
import { Droplets, Wind, Bug, Lightbulb, RefreshCw, Cloud, Activity, Settings, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// ── Lazy-load heavy chart components — excluded from initial bundle ────────────
const SoilTrendChart = dynamic(
  () => import('@/components/charts/SoilChart').then(m => ({ default: m.SoilTrendChart })),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full" /> }
);
const NPKChart = dynamic(
  () => import('@/components/charts/SoilChart').then(m => ({ default: m.NPKChart })),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full" /> }
);

interface SensorReading { moisture: number; temperature: number; humidity: number; ph: number; nitrogen: number; phosphorus: number; potassium: number; timestamp: string; }
interface Recommendation { id: string; icon: string; title: string; action: string; priority: string; }
interface DiseaseResult { disease_name: string; severity: string; confidence: number; treatment: string; }
interface DashboardData { latest_reading: SensorReading | null; weekly_trend: Record<string, number | string>[]; recommendations: Recommendation[]; latest_disease: DiseaseResult | null; }
interface WeatherCurrent { temperature: number; description: string; humidity: number; wind_speed: number; icon: string; city: string; }
interface WeatherForecastItem { time: number; temperature: number; description: string; icon: string; }
interface WeatherResponse { current?: WeatherCurrent; forecast?: WeatherForecastItem[]; }

function moistureStatus(v: number) { if (v < 20) return { status: 'danger' as const, statusLabel: 'Critical Low' }; if (v < 35) return { status: 'warning' as const, statusLabel: 'Low' }; if (v > 70) return { status: 'warning' as const, statusLabel: 'Waterlogged' }; return { status: 'optimal' as const, statusLabel: 'Optimal' }; }
function tempStatus(v: number) { if (v > 35) return { status: 'danger' as const, statusLabel: 'Heat Stress' }; if (v < 10) return { status: 'warning' as const, statusLabel: 'Cold Risk' }; return { status: 'optimal' as const, statusLabel: 'Normal' }; }
function phStatus(v: number) { if (v < 5.5 || v > 8.0) return { status: 'danger' as const, statusLabel: v < 5.5 ? 'Acidic' : 'Alkaline' }; if (v < 6.0 || v > 7.5) return { status: 'warning' as const, statusLabel: 'Marginal' }; return { status: 'optimal' as const, statusLabel: 'Optimal' }; }
function npkStatus(v: number, low: number) { if (v < low) return { status: 'danger' as const, statusLabel: 'Low' }; if (v < low * 1.3) return { status: 'warning' as const, statusLabel: 'Marginal' }; return { status: 'optimal' as const, statusLabel: 'Good' }; }

const WMO_MAP: Record<number, { emoji: string; desc: string }> = {
  0: { emoji: '☀️', desc: 'Clear sky' }, 1: { emoji: '🌤️', desc: 'Mainly clear' }, 2: { emoji: '⛅', desc: 'Partly cloudy' }, 3: { emoji: '☁️', desc: 'Overcast' },
  45: { emoji: '🌫️', desc: 'Foggy' }, 48: { emoji: '🌫️', desc: 'Rime fog' },
  51: { emoji: '🌦️', desc: 'Light drizzle' }, 53: { emoji: '🌦️', desc: 'Drizzle' }, 55: { emoji: '🌧️', desc: 'Dense drizzle' },
  61: { emoji: '🌧️', desc: 'Slight rain' }, 63: { emoji: '🌧️', desc: 'Rain' }, 65: { emoji: '🌧️', desc: 'Heavy rain' },
  71: { emoji: '🌨️', desc: 'Light snow' }, 73: { emoji: '🌨️', desc: 'Snow' }, 75: { emoji: '❄️', desc: 'Heavy snow' },
  80: { emoji: '🌦️', desc: 'Showers' }, 81: { emoji: '🌧️', desc: 'Moderate showers' }, 82: { emoji: '⛈️', desc: 'Violent showers' },
  95: { emoji: '⛈️', desc: 'Thunderstorm' }, 96: { emoji: '⛈️', desc: 'Thunderstorm w/ hail' }, 99: { emoji: '⛈️', desc: 'Severe thunderstorm' },
};
function getWmo(code: number) { return WMO_MAP[code] || WMO_MAP[Math.floor(code / 10) * 10] || { emoji: '🌡️', desc: 'Weather' }; }

async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherResponse> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,weather_code&timezone=auto&forecast_days=6`;
  const res = await fetch(url).then(r => r.json());
  let city = 'Your Location';
  try {
    const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`).then(r => r.json());
    city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.state || 'Your Location';
  } catch { /* fallback */ }
  const cur = res.current;
  const wmo = getWmo(cur.weather_code);
  return {
    current: { city, temperature: cur.temperature_2m, humidity: cur.relative_humidity_2m, wind_speed: cur.wind_speed_10m, description: wmo.desc, icon: wmo.emoji },
    forecast: res.daily.time.slice(1, 6).map((date: string, i: number) => {
      const w = getWmo(res.daily.weather_code[i + 1]);
      return { time: new Date(date).getTime() / 1000, temperature: res.daily.temperature_2m_max[i + 1], description: w.desc, icon: w.emoji };
    }),
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setCoords({ lat: 28.6139, lon: 77.2090 }),
      { timeout: 10000 }
    );
  }, []);

  const { data: dash, isLoading, error, dataUpdatedAt } = useQuery<DashboardData>(
    'dashboard', () => dashboardAPI.get().then((r) => r.data as DashboardData), { refetchInterval: 60_000 }
  );
  const { data: weatherData, isLoading: weatherLoading } = useQuery<WeatherResponse>(
    ['weather', coords?.lat, coords?.lon],
    () => fetchWeatherByCoords(coords!.lat, coords!.lon),
    { enabled: !!coords, refetchInterval: 10 * 60_000, staleTime: 5 * 60_000, retry: 2 }
  );

  // ── Optimistic WebSocket updates ─────────────────────────────────────────
  // Instead of refetching the entire dashboard, inject the fresh sensor reading
  // directly into the query cache — zero latency, zero extra network requests.
  const wsHandler = useCallback((msg: { event: string; data?: unknown }) => {
    if (msg.event === 'sensor_update' && msg.data) {
      qc.setQueryData<DashboardData>('dashboard', (old) => {
        if (!old) return old!;
        return { ...old, latest_reading: msg.data as SensorReading };
      });
    }
  }, [qc]);
  const ws = useWebSocket(wsHandler);
  
  // Log WebSocket errors for debugging
  useEffect(() => {
    if (ws.error) {
      console.error('[WS] Dashboard error:', ws.error);
    }
  }, [ws.error]);

  const s = dash?.latest_reading ?? null;
  const wkly = dash?.weekly_trend ?? [];
  const recs = dash?.recommendations ?? [];

  const containerV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } } as const;
  const itemV = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } } as const;

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-gradient">{user?.name?.split(' ')[0] ?? 'Farmer'}</span> 👋
          </h1>
          <p className="text-foreground/60 dark:text-foreground/70 mt-1 text-sm flex items-center gap-2">
            {user?.farm_location?.city ? `📍 ${user.farm_location.city}, ${user.farm_location.state ?? ''}` : 'Farm overview'}
            <span className="text-emerald-500/40">·</span> {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <Button variant="outline" onClick={() => qc.invalidateQueries('dashboard')} className="gap-2 font-medium shadow-sm rounded-xl" disabled={isLoading}>
          <RefreshCw size={15} className={cn(isLoading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {!!error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
          ⚠️ Could not load sensor data. Make sure the backend is running.
        </div>
      )}

      {dataUpdatedAt > 0 && (
        <p className="text-[11px] uppercase tracking-widest text-foreground/50 dark:text-foreground/60 mb-5 font-semibold flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Last sync: {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
          {s?.timestamp && (<><span className="w-1 h-1 rounded-full bg-border" /><span>Sensor: {formatDistanceToNow(new Date(s.timestamp), { addSuffix: true })}</span></>)}
        </p>
      )}

      <motion.div variants={containerV} initial="hidden" animate="show" className="space-y-6">
        
        {/* Core Sensors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Soil Moisture", value: s?.moisture, unit: "%", icon: "💧", ...s ? moistureStatus(s.moisture) : { status: 'info' as const } },
            { label: "Temperature", value: s?.temperature, unit: "°C", icon: "🌡️", ...s ? tempStatus(s.temperature) : { status: 'info' as const } },
            { label: "Humidity", value: s?.humidity, unit: "%", icon: "🌫️", status: s ? (s.humidity > 85 ? 'warning' as const : 'info' as const) : 'info' as const, statusLabel: s ? (s.humidity > 85 ? 'High' : 'Normal') : undefined },
            { label: "Soil pH", value: s?.ph, unit: "pH", icon: "🧪", ...s ? phStatus(s.ph) : { status: 'info' as const } }
          ].map((sensor, i) => (
            <motion.div key={i} variants={itemV}><SensorCard {...sensor} loading={isLoading} /></motion.div>
          ))}
        </div>

        {/* NPK Sensors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[
             { label: "Nitrogen (N)", val: s?.nitrogen, unit: "mg/kg", icon: "🌿", ...s ? npkStatus(s.nitrogen, 50) : { status: 'info' as const, statusLabel: undefined } },
             { label: "Phosphorus (P)", val: s?.phosphorus, unit: "mg/kg", icon: "🌾", ...s ? npkStatus(s.phosphorus, 25) : { status: 'info' as const, statusLabel: undefined } },
             { label: "Potassium (K)", val: s?.potassium, unit: "mg/kg", icon: "🍂", ...s ? npkStatus(s.potassium, 30) : { status: 'info' as const, statusLabel: undefined } },
           ].map((npk, i) => (
             <motion.div key={i} variants={itemV}>
               <SensorCard label={npk.label} value={npk.val} unit={npk.unit} icon={npk.icon} loading={isLoading} status={npk.status} statusLabel={npk.statusLabel} />
             </motion.div>
           ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <motion.div variants={itemV} className="space-y-5 h-full">
            <Card className="overflow-hidden relative h-full dark:ring-1 dark:ring-emerald-500/10">
              <CardHeader className="pb-2 border-b border-border/20">
                <CardTitle className="text-base flex items-center gap-2"><Activity size={17} className="text-emerald-500" /> <span className="text-foreground">Soil Insights</span></CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 gap-7">
                  <div>
                    <h4 className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">7-Day Trend</h4>
                    {isLoading ? <Skeleton className="h-[200px] w-full" /> : wkly.length > 0 ? <SoilTrendChart data={wkly} height={200} /> : <EmptyChart message="Sensor history will appear here" />}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-3">Nutrient Flow (NPK)</h4>
                    {isLoading ? <Skeleton className="h-[200px] w-full" /> : wkly.length > 0 ? <NPKChart data={wkly} height={200} /> : <EmptyChart message="NPK history will appear here" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemV} className="h-full">
             <WeatherCard weather={weatherData} loading={weatherLoading} />
          </motion.div>
        </div>

        {/* Recs and Disease */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div variants={itemV}>
            <Card className="h-full dark:ring-1 dark:ring-emerald-500/10">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 border-b border-border/20">
                <CardTitle className="text-base flex items-center gap-2 font-bold"><Lightbulb size={17} className="text-amber-500" /> <span className="text-foreground">AI Recommendations</span></CardTitle>
                <Link href="/recommendations" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold px-3 py-1 rounded-full bg-emerald-500/10 transition-colors hover:bg-emerald-500/20">View All</Link>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2.5">
                  {isLoading ? (
                    <><Skeleton className="h-[70px] w-full rounded-xl" /><Skeleton className="h-[70px] w-full rounded-xl" /></>
                  ) : recs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/40">
                      <Lightbulb size={28} className="text-muted-foreground/40 mb-2.5" />
                      <span className="text-sm font-medium text-foreground">Awaiting telemetry data</span>
                      <span className="text-xs text-muted-foreground mt-1">AI will formulate recommendations soon</span>
                    </div>
                  ) : recs.slice(0, 3).map((r) => (
                    <div key={r.id} className={cn("flex gap-3 p-3.5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5",
                      r.priority === 'critical' ? 'bg-red-500/5 border-red-500/15' : 
                      r.priority === 'high' ? 'bg-orange-500/5 border-orange-500/15' : 
                      'bg-emerald-500/5 border-emerald-500/15'
                    )}>
                      <div className="text-xl mt-0.5 bg-background/60 backdrop-blur-sm p-2 rounded-lg border border-border/30 h-fit">{r.icon}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground text-sm truncate">{r.title}</p>
                          <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                            r.priority === 'critical' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 
                            r.priority === 'high' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          )}>{r.priority}</span>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">{r.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemV}>
            <Card className="h-full relative overflow-hidden group dark:ring-1 dark:ring-emerald-500/10">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 border-b border-border/20 relative z-10">
                <CardTitle className="text-base flex items-center gap-2 font-bold"><Bug size={17} className="text-red-500" /> <span className="text-foreground">Plant Pathology</span></CardTitle>
                <Link href="/disease" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold px-3 py-1 rounded-full bg-emerald-500/10 transition-colors hover:bg-emerald-500/20">Run Scan</Link>
              </CardHeader>
              <CardContent className="pt-4 relative z-10">
                {isLoading ? (
                   <Skeleton className="h-[160px] w-full rounded-xl" />
                ) : dash?.latest_disease ? (
                  <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/30 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn("px-3 py-1 rounded-lg text-sm font-bold border uppercase tracking-wide", 
                        dash.latest_disease.severity === 'critical' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                        dash.latest_disease.severity === 'high' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' : 
                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      )}>
                        {dash.latest_disease.disease_name}
                      </div>
                      <div className="text-right">
                         <div className="text-2xl font-black text-foreground">{(dash.latest_disease.confidence * 100).toFixed(0)}%</div>
                         <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Confidence</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border/30">
                      <span className="font-semibold text-foreground flex items-center gap-2 mb-1.5 text-xs uppercase tracking-wider"><Settings size={11}/> Treatment</span>
                      <p className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/20">{dash.latest_disease.treatment}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[160px] flex flex-col items-center justify-center p-6 text-center bg-muted/15 rounded-xl border border-dashed border-border/40">
                    <div className="text-3xl mb-3">📷</div>
                    <span className="text-sm font-medium text-foreground mb-1">No Active Threats</span>
                    <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed mb-3">Upload a leaf photo to screen for pathogens.</p>
                    <Link href="/disease"><Button size="sm" className="rounded-full shadow-sm px-5 font-medium text-xs">Start Diagnostics</Button></Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

      </motion.div>
    </AppLayout>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-muted-foreground text-sm gap-2 bg-muted/15 rounded-xl border border-dashed border-border/40 h-full min-h-[200px]">
      <span className="text-2xl opacity-30">📉</span>
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
}

function WeatherCard({ weather, loading }: { weather?: WeatherResponse; loading?: boolean }) {
  const c = weather?.current;
  const f = weather?.forecast ?? [];

  return (
    <Card className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white shadow-xl shadow-blue-500/15 border-0 relative overflow-hidden flex flex-col h-full ring-1 ring-white/10">
      <div className="absolute top-0 right-0 p-6 opacity-[0.08] pointer-events-none">
        <Cloud size={140} />
      </div>
      <div className="absolute -top-20 -left-20 w-56 h-56 bg-white/8 rounded-full blur-3xl pointer-events-none" />
      <CardHeader className="pb-0 relative z-10 pt-5">
        <CardTitle className="text-[11px] flex items-center justify-between text-white/90 font-bold tracking-widest uppercase">
          <span className="flex items-center gap-2"><Cloud size={13} /> Live Weather</span>
          <span className="bg-white/15 px-2.5 py-1 rounded-lg backdrop-blur-sm text-[10px] font-semibold">5-DAY</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 relative z-10 flex-1 flex flex-col justify-between">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 gap-3">
            <Loader2 size={28} className="animate-spin text-white/50" />
            <p className="text-sm font-medium text-white/80">Detecting location…</p>
          </div>
        ) : c ? (
          <>
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 border border-white/10">
                  <MapPin size={11} className="text-emerald-300" /> {c.city}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-white/15 rounded-2xl w-[72px] h-[72px] backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <span className="text-4xl">{c.icon}</span>
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tighter">{c.temperature.toFixed(0)}°</div>
                  <div className="text-sm font-medium capitalize text-white/80 mt-0.5">{c.description}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center justify-between">
                  <div className="text-white/70 text-[11px] font-semibold uppercase tracking-wider"><Droplets size={11} className="text-blue-300 inline mr-1"/> Humidity</div>
                  <div className="font-bold text-base">{c.humidity}%</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center justify-between">
                  <div className="text-white/70 text-[11px] font-semibold uppercase tracking-wider"><Wind size={11} className="text-teal-300 inline mr-1"/> Wind</div>
                  <div className="font-bold text-base">{c.wind_speed.toFixed(0)} <span className="text-[10px] font-medium text-white/60">km/h</span></div>
                </div>
              </div>
            </div>

            {f.length > 0 && (
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-md border border-white/10 mt-auto">
                <div className="flex justify-between items-center gap-1">
                   {f.map((day: WeatherForecastItem, idx: number) => (
                      <div key={idx} className="flex flex-col items-center justify-center p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-1">
                         <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">{format(day.time * 1000, 'EEE')}</span>
                         <span className="text-xl my-0.5">{day.icon}</span>
                         <span className="text-xs font-bold">{day.temperature.toFixed(0)}°</span>
                      </div>
                   ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <Cloud size={36} className="mb-3 opacity-50" />
            <p className="text-sm font-medium text-white/80">Weather unavailable</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
