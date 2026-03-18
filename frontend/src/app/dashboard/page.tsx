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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

interface SensorReading { moisture: number; temperature: number; humidity: number; ph: number; nitrogen: number; phosphorus: number; potassium: number; timestamp: string; }
interface Recommendation { id: string; icon: string; title: string; action: string; priority: string; }
interface DiseaseResult { disease_name: string; severity: string; confidence: number; treatment: string; }
interface DashboardData { latest_reading: SensorReading | null; weekly_trend: Record<string, number | string>[]; recommendations: Recommendation[]; latest_disease: DiseaseResult | null; }
interface WeatherCurrent { temperature: number; description: string; humidity: number; wind_speed: number; icon: string; city: string; }

function moistureStatus(v: number) { if (v < 20) return { status: 'danger' as const, statusLabel: 'Critical Low' }; if (v < 35) return { status: 'warning' as const, statusLabel: 'Low' }; if (v > 70) return { status: 'warning' as const, statusLabel: 'Waterlogged' }; return { status: 'optimal' as const, statusLabel: 'Optimal' }; }
function tempStatus(v: number) { if (v > 35) return { status: 'danger' as const, statusLabel: 'Heat Stress' }; if (v < 10) return { status: 'warning' as const, statusLabel: 'Cold Risk' }; return { status: 'optimal' as const, statusLabel: 'Normal' }; }
function phStatus(v: number) { if (v < 5.5 || v > 8.0) return { status: 'danger' as const, statusLabel: v < 5.5 ? 'Acidic' : 'Alkaline' }; if (v < 6.0 || v > 7.5) return { status: 'warning' as const, statusLabel: 'Marginal' }; return { status: 'optimal' as const, statusLabel: 'Optimal' }; }
function npkStatus(v: number, low: number) { if (v < low) return { status: 'danger' as const, statusLabel: 'Low' }; if (v < low * 1.3) return { status: 'warning' as const, statusLabel: 'Marginal' }; return { status: 'optimal' as const, statusLabel: 'Good' }; }

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

  const s = dash?.latest_reading ?? null;
  const wkly = dash?.weekly_trend ?? [];
  const recs = dash?.recommendations ?? [];

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
            <span className="text-primary">{user?.name?.split(' ')[0] ?? 'Farmer'}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium flex items-center gap-2">
            {user?.farm_location?.city
              ? `📍 ${user.farm_location.city}, ${user.farm_location.state ?? ''}`
              : 'Farm overview'}{' '}
            <span className="text-border">•</span> {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => qc.invalidateQueries('dashboard')}
          className="gap-2 font-semibold shadow-sm"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {!!error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-8 text-destructive text-sm font-medium flex items-center gap-2">
          ⚠️ Could not load sensor data. Make sure the backend is running and your IoT device is connected.
        </div>
      )}

      {dataUpdatedAt > 0 && (
        <p className="text-xs text-muted-foreground mb-4 font-medium flex items-center gap-2">
          <span>Last updated: {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}</span>
          {s?.timestamp && (
            <>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Sensor: {formatDistanceToNow(new Date(s.timestamp), { addSuffix: true })}</span>
            </>
          )}
        </p>
      )}

      {/* Primary Sensors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <SensorCard label="Soil Moisture" value={s?.moisture} unit="%" icon="💧" loading={isLoading} {...(s ? moistureStatus(s.moisture) : { status: 'info' as const })} />
        <SensorCard label="Temperature" value={s?.temperature} unit="°C" icon="🌡️" loading={isLoading} {...(s ? tempStatus(s.temperature) : { status: 'info' as const })} />
        <SensorCard label="Humidity" value={s?.humidity} unit="%" icon="🌫️" loading={isLoading}
          status={s ? (s.humidity > 85 ? 'warning' : 'info') : 'info'}
          statusLabel={s ? (s.humidity > 85 ? 'High' : 'Normal') : undefined}
        />
        <SensorCard label="Soil pH" value={s?.ph} unit="pH" icon="🧪" loading={isLoading} {...(s ? phStatus(s.ph) : { status: 'info' as const })} />
      </div>

      {/* NPK Sensors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SensorCard label="Nitrogen (N)" value={s?.nitrogen} unit="mg/kg" icon="🌿" loading={isLoading} {...(s ? npkStatus(s.nitrogen, 50) : { status: 'info' as const })} />
        <SensorCard label="Phosphorus (P)" value={s?.phosphorus} unit="mg/kg" icon="🌾" loading={isLoading} {...(s ? npkStatus(s.phosphorus, 25) : { status: 'info' as const })} />
        <SensorCard label="Potassium (K)" value={s?.potassium} unit="mg/kg" icon="🍂" loading={isLoading} {...(s ? npkStatus(s.potassium, 30) : { status: 'info' as const })} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">7-Day Soil Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[260px] w-full mt-2" /> : 
             wkly.length > 0 ? <div className="mt-2"><SoilTrendChart data={wkly} /></div> : <EmptyChart message="No history yet — sensor data will appear here" />}
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">NPK Levels (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[260px] w-full mt-2" /> : 
             wkly.length > 0 ? <div className="mt-2"><NPKChart data={wkly} /></div> : <EmptyChart message="Historical NPK data will appear here" />}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WeatherCard current={weatherData?.current} />

        <Card className="shadow-sm flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <Lightbulb size={18} className="text-primary" /> Recommendations
            </CardTitle>
            <Link href="/recommendations" className="text-xs text-primary hover:underline font-semibold">View all</Link>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            <div className="space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-[70px] w-full rounded-xl" />
                  <Skeleton className="h-[70px] w-full rounded-xl" />
                  <Skeleton className="h-[70px] w-full rounded-xl" />
                </>
              ) : recs.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center p-6 text-sm text-muted-foreground text-center">
                  Connect a sensor to get personalized field recommendations
                </div>
              ) : recs.slice(0, 3).map((r) => (
                <div key={r.id} className={cn(
                  "flex gap-3 p-3.5 rounded-xl border transition-colors hover:shadow-sm",
                  r.priority === 'critical' ? 'bg-destructive/5 border-destructive/10' : 
                  r.priority === 'high' ? 'bg-orange-400/5 border-orange-400/10' : 
                  r.priority === 'medium' ? 'bg-blue-400/5 border-blue-400/10' : 
                  'bg-primary/5 border-primary/10'
                )}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{r.icon}</span>
                  <div>
                    <p className="font-semibold text-foreground text-sm leading-tight mb-1">{r.title}</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">{r.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <Bug size={18} className="text-destructive" /> Latest Detection
            </CardTitle>
            <Link href="/disease" className="text-xs text-primary hover:underline font-semibold">Detect</Link>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            {isLoading ? (
               <Skeleton className="h-[150px] w-full rounded-xl" />
            ) : dash?.latest_disease ? (
              <div className="space-y-4">
                <div className={cn(
                  "p-4 rounded-xl text-sm font-bold border", 
                  dash.latest_disease.severity === 'critical' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                  dash.latest_disease.severity === 'high' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' : 
                  'bg-primary/10 text-primary border-primary/20'
                   )}>
                  {dash.latest_disease.disease_name}
                </div>
                <div className="text-sm text-muted-foreground space-y-2.5 px-1">
                  <p className="flex justify-between items-center">
                    <span>Confidence</span>
                    <span className="font-semibold text-foreground bg-accent px-2 py-0.5 rounded-md">{(dash.latest_disease.confidence * 100).toFixed(0)}%</span>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>Severity</span>
                    <span className="font-semibold text-foreground capitalize bg-accent px-2 py-0.5 rounded-md">{dash.latest_disease.severity}</span>
                  </p>
                  <div className="pt-3 mt-3 border-t border-border">
                    <span className="font-semibold text-foreground block mb-2 text-xs uppercase tracking-wider">Treatment</span>
                    <p className="text-xs italic leading-relaxed text-muted-foreground bg-muted/30 p-3 rounded-lg border border-dashed border-border/60">{dash.latest_disease.treatment}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center py-6">
                <div className="text-4xl mb-3 opacity-80 group-hover:scale-110 transition-transform cursor-default">📷</div>
                <p className="text-sm text-muted-foreground text-center mb-5 max-w-[200px] leading-relaxed">Upload a leaf photo to detect potential plant diseases</p>
                <Link href="/disease">
                  <Button size="sm" className="rounded-full shadow-sm px-6">Try Detection</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground text-sm font-medium gap-3 bg-muted/20 rounded-xl border border-dashed mt-2">
      <span className="text-4xl opacity-50 drop-shadow-sm grayscale">📊</span>
      {message}
    </div>
  );
}

function WeatherCard({ current: c }: { current?: WeatherCurrent }) {
  return (
    <Card className="bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] text-white shadow-md border-0 relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Cloud size={140} />
      </div>
      <CardHeader className="pb-0 relative z-10">
        <CardTitle className="text-xs flex items-center gap-2 text-white/90 font-bold tracking-widest uppercase">
          <Cloud size={16} /> Current Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 relative z-10 flex-1 flex flex-col justify-between">
        {c ? (
          <>
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-white/20 rounded-3xl p-2 backdrop-blur-md shadow-inner">
                  <Image src={`https://openweathermap.org/img/wn/${c.icon}@2x.png`} alt={c.description} width={64} height={64} unoptimized className="drop-shadow-lg" />
                </div>
                <div>
                  <div className="text-5xl font-black tracking-tighter drop-shadow-md">{c.temperature.toFixed(0)}°C</div>
                  <div className="text-base font-medium capitalize text-white/90 drop-shadow-sm">{c.description}</div>
                </div>
              </div>
              <div className="text-sm font-medium text-white/80 flex items-center gap-1.5 mt-3 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                {c.city}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 transition-colors hover:bg-black/30 group">
                <div className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Droplets size={12} className="group-hover:text-blue-300 transition-colors"/> Humidity</div>
                <div className="font-bold text-xl">{c.humidity}%</div>
              </div>
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 transition-colors hover:bg-black/30 group">
                <div className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Wind size={12} className="group-hover:text-blue-300 transition-colors"/> Wind</div>
                <div className="font-bold text-xl">{c.wind_speed} <span className="text-sm font-medium text-white/70">m/s</span></div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 text-white/70">
            <Cloud size={40} className="mb-4 opacity-50" />
            <p className="text-sm font-medium leading-relaxed">Configure farm location<br/>to see live weather</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
