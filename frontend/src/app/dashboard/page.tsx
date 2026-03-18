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
import { Droplets, Wind, Bug, Lightbulb, RefreshCw, Cloud, Activity, Users, Settings, Database, Server } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SensorReading { moisture: number; temperature: number; humidity: number; ph: number; nitrogen: number; phosphorus: number; potassium: number; timestamp: string; }
interface Recommendation { id: string; icon: string; title: string; action: string; priority: string; }
interface DiseaseResult { disease_name: string; severity: string; confidence: number; treatment: string; }
interface DashboardData { latest_reading: SensorReading | null; weekly_trend: Record<string, number | string>[]; recommendations: Recommendation[]; latest_disease: DiseaseResult | null; }
interface WeatherCurrent { temperature: number; description: string; humidity: number; wind_speed: number; icon: string; city: string; }

function moistureStatus(v: number) { if (v < 20) return { status: 'danger' as const, statusLabel: 'Critical Low' }; if (v < 35) return { status: 'warning' as const, statusLabel: 'Low' }; if (v > 70) return { status: 'warning' as const, statusLabel: 'Waterlogged' }; return { status: 'optimal' as const, statusLabel: 'Optimal' }; }
function tempStatus(v: number) { if (v > 35) return { status: 'danger' as const, statusLabel: 'Heat Stress' }; if (v < 10) return { status: 'warning' as const, statusLabel: 'Cold Risk' }; return { status: 'optimal' as const, statusLabel: 'Normal' }; }
function phStatus(v: number) { if (v < 5.5 || v > 8.0) return { status: 'danger' as const, statusLabel: v < 5.5 ? 'Acidic' : 'Alkaline' }; if (v < 6.0 || v > 7.5) return { status: 'warning' as const, statusLabel: 'Marginal' }; return { status: 'optimal' as const, statusLabel: 'Optimal' }; }
function npkStatus(v: number, low: number) { if (v < low) return { status: 'danger' as const, statusLabel: 'Low' }; if (v < low * 1.3) return { status: 'warning' as const, statusLabel: 'Marginal' }; return { status: 'optimal' as const, statusLabel: 'Good' }; }

const ACTIVITY_LOG = [
  { id: 1, type: 'sensor', msg: 'ESP32 Node 1 reconnected', time: '5m ago', icon: Server },
  { id: 2, type: 'alert', msg: 'Auto-irrigation initiated (Zone B)', time: '12m ago', icon: Droplets },
  { id: 3, type: 'team', msg: 'Rohan added a new disease record', time: '1h ago', icon: Users },
  { id: 4, type: 'system', msg: 'Weekly backup completed', time: '3h ago', icon: Database },
];

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

  const wsHandler = useCallback((msg: { event: string }) => { if (msg.event === 'sensor_update') qc.invalidateQueries('dashboard'); }, [qc]);
  useWebSocket(wsHandler);

  const s = dash?.latest_reading ?? null;
  const wkly = dash?.weekly_trend ?? [];
  const recs = dash?.recommendations ?? [];

  const containerVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400 drop-shadow-sm">{user?.name?.split(' ')[0] ?? 'Farmer'}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium flex items-center gap-2">
            {user?.farm_location?.city ? `📍 ${user.farm_location.city}, ${user.farm_location.state ?? ''}` : 'Farm overview'}
            <span className="text-border px-1">•</span> {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Avatar Group */}
          <div className="hidden sm:flex items-center -space-x-2 mr-2 hover:-space-x-1 transition-all duration-300">
             <div className="w-8 h-8 rounded-full border-2 border-background bg-blue-500 text-white text-xs font-bold flex items-center justify-center shadow-sm z-30">SA</div>
             <div className="w-8 h-8 rounded-full border-2 border-background bg-purple-500 text-white text-xs font-bold flex items-center justify-center shadow-sm z-20">RB</div>
             <div className="w-8 h-8 rounded-full border-2 border-background bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shadow-sm z-10 backdrop-blur-sm">+3</div>
          </div>
          <Button variant="outline" onClick={() => qc.invalidateQueries('dashboard')} className="gap-2 font-semibold shadow-sm rounded-xl hover:bg-primary hover:text-primary-foreground border-border/50 transition-colors" disabled={isLoading}>
            <RefreshCw size={16} className={cn(isLoading && "animate-spin")} /> Refresh
          </Button>
        </div>
      </div>

      {!!error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-8 text-destructive text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          ⚠️ Could not load sensor data. Make sure the backend is running and your IoT device is connected.
        </div>
      )}

      {dataUpdatedAt > 0 && (
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-4 font-bold flex items-center gap-2">
          <span>Last sync: {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}</span>
          {s?.timestamp && (
            <>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Sensor record: {formatDistanceToNow(new Date(s.timestamp), { addSuffix: true })}</span>
            </>
          )}
        </p>
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 lg:space-y-8">
        
        {/* Core Sensors */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Soil Moisture", value: s?.moisture, unit: "%", icon: "💧", ...s ? moistureStatus(s.moisture) : { status: 'info' as const } },
            { label: "Temperature", value: s?.temperature, unit: "°C", icon: "🌡️", ...s ? tempStatus(s.temperature) : { status: 'info' as const } },
            { label: "Humidity", value: s?.humidity, unit: "%", icon: "🌫️", status: s ? (s.humidity > 85 ? 'warning' as const : 'info' as const) : 'info' as const, statusLabel: s ? (s.humidity > 85 ? 'High' : 'Normal') : undefined },
            { label: "Soil pH", value: s?.ph, unit: "pH", icon: "🧪", ...s ? phStatus(s.ph) : { status: 'info' as const } }
          ].map((sensor, i) => (
            <motion.div key={i} variants={itemVariants}>
               <SensorCard {...sensor} loading={isLoading} />
            </motion.div>
          ))}
        </div>

        {/* NPK Sensors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[
             { label: "Nitrogen (N)", val: s?.nitrogen, unit: "mg/kg", icon: "🌿", ...s ? npkStatus(s.nitrogen, 50) : { status: 'info' as const, statusLabel: undefined } },
             { label: "Phosphorus (P)", val: s?.phosphorus, unit: "mg/kg", icon: "🌾", ...s ? npkStatus(s.phosphorus, 25) : { status: 'info' as const, statusLabel: undefined } },
             { label: "Potassium (K)", val: s?.potassium, unit: "mg/kg", icon: "🍂", ...s ? npkStatus(s.potassium, 30) : { status: 'info' as const, statusLabel: undefined } },
           ].map((npk, i) => (
             <motion.div key={i} variants={itemVariants}>
               <SensorCard label={npk.label} value={npk.val} unit={npk.unit} icon={npk.icon} loading={isLoading} status={npk.status} statusLabel={npk.statusLabel} />
             </motion.div>
           ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="xl:col-span-2 space-y-6">
            <Card className="shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3" />
              <CardHeader className="pb-2 border-b border-border/30">
                <CardTitle className="text-lg flex items-center gap-2"><Activity size={18} className="text-primary" /> Multi-Layer Soil Insights</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">7-Day Condition Trend</h4>
                    {isLoading ? <Skeleton className="h-[220px] w-full" /> : wkly.length > 0 ? <SoilTrendChart data={wkly} height={220} /> : <EmptyChart message="Sensor history graph goes here" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Nutrient Flow (NPK)</h4>
                    {isLoading ? <Skeleton className="h-[220px] w-full" /> : wkly.length > 0 ? <NPKChart data={wkly} height={220} /> : <EmptyChart message="NPK history graph goes here" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right sidebar insights */}
          <motion.div variants={itemVariants} className="space-y-6">
             <WeatherCard current={weatherData?.current} />
             
             {/* Dynamic Activity Feed */}
             <Card className="shadow-sm">
               <CardHeader className="pb-3 border-b border-border/30">
                 <CardTitle className="text-base font-bold flex items-center gap-2"><Activity size={16} className="text-blue-500" /> Farm Activity Feed</CardTitle>
               </CardHeader>
               <CardContent className="pt-4 p-0">
                 <div className="divide-y divide-border/50 max-h-[220px] overflow-y-auto custom-scrollbar">
                   {ACTIVITY_LOG.map((log) => (
                     <div key={log.id} className="p-4 flex gap-3 hover:bg-muted/30 transition-colors group">
                       <div className="mt-0.5"><log.icon size={16} className="text-muted-foreground group-hover:text-primary transition-colors" /></div>
                       <div>
                         <p className="text-sm font-medium text-foreground">{log.msg}</p>
                         <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">{log.time}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
          </motion.div>
        </div>

        {/* Lower row: Recs and Disease */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm h-full">
              <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0 border-b border-border/30">
                <CardTitle className="text-base flex items-center gap-2 font-bold"><Lightbulb size={18} className="text-amber-500" /> AI Recommendations</CardTitle>
                <Link href="/recommendations" className="text-xs text-primary hover:underline font-bold px-3 py-1 rounded-full bg-primary/10 transition-colors hover:bg-primary hover:text-white">View AI Module</Link>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="space-y-3">
                  {isLoading ? (
                    <><Skeleton className="h-[75px] w-full rounded-xl" /><Skeleton className="h-[75px] w-full rounded-xl" /></>
                  ) : recs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60">
                      <Lightbulb size={32} className="text-muted-foreground/50 mb-3" />
                      <span className="text-sm font-semibold text-foreground">Awaiting telemetry data</span>
                      <span className="text-xs text-muted-foreground mt-1">AI will formulate recommendations soon</span>
                    </div>
                  ) : recs.slice(0, 3).map((r) => (
                    <div key={r.id} className={cn("flex gap-3.5 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5",
                      r.priority === 'critical' ? 'bg-destructive/5 border-destructive/20 hover:border-destructive/40' : 
                      r.priority === 'high' ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40' : 
                      'bg-primary/5 border-primary/20 hover:border-primary/40'
                    )}>
                      <div className="text-2xl mt-0.5 bg-background p-2 rounded-lg shadow-sm border border-border/50 h-fit">{r.icon}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="font-bold text-foreground text-sm">{r.title}</p>
                          <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                            r.priority === 'critical' ? 'bg-destructive text-destructive-foreground' : 
                            r.priority === 'high' ? 'bg-orange-500 text-white' : 'bg-primary/20 text-primary'  
                          )}>{r.priority}</span>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed font-medium">{r.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="shadow-sm h-full relative overflow-hidden group">
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors" />
              <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0 border-b border-border/30 relative z-10">
                <CardTitle className="text-base flex items-center gap-2 font-bold"><Bug size={18} className="text-destructive" /> Plant Pathology Scans</CardTitle>
                <Link href="/disease" className="text-xs text-primary hover:underline font-bold px-3 py-1 rounded-full bg-primary/10 transition-colors hover:bg-primary hover:text-white">Run Scan</Link>
              </CardHeader>
              <CardContent className="pt-5 relative z-10">
                {isLoading ? (
                   <Skeleton className="h-[180px] w-full rounded-xl" />
                ) : dash?.latest_disease ? (
                  <div className="bg-background/80 backdrop-blur-sm rounded-xl p-5 border border-border/50 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("px-3 py-1.5 rounded-lg text-sm font-black tracking-wide border uppercase", 
                        dash.latest_disease.severity === 'critical' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        dash.latest_disease.severity === 'high' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' : 
                        'bg-primary/10 text-primary border-primary/20'
                         )}>
                        {dash.latest_disease.disease_name}
                      </div>
                      <div className="text-right">
                         <div className="text-2xl font-black text-foreground">{(dash.latest_disease.confidence * 100).toFixed(0)}%</div>
                         <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Confidence</div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-border/60">
                      <span className="font-bold text-foreground flex items-center gap-2 mb-2 text-xs uppercase tracking-widest"><Settings size={12}/> Treatment Protocol</span>
                      <p className="text-sm font-medium leading-relaxed text-muted-foreground bg-muted/40 p-3.5 rounded-xl border border-border/50">{dash.latest_disease.treatment}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[180px] flex flex-col items-center justify-center p-6 text-center bg-muted/20 rounded-xl border border-dashed border-border/60">
                    <div className="text-4xl mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">📷</div>
                    <span className="text-sm font-semibold text-foreground mb-1">No Active Threats Detected</span>
                    <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed mb-4">Upload a leaf photo to screen for potential pathogens.</p>
                    <Link href="/disease"><Button size="sm" className="rounded-full shadow-sm px-6 font-bold hover:shadow-primary/20 hover:shadow-md transition-all">Start Diagnostics</Button></Link>
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
    <div className="flex flex-col items-center justify-center text-muted-foreground text-sm font-medium gap-3 bg-muted/20 rounded-xl border border-dashed border-border/60 h-full min-h-[220px]">
      <span className="text-3xl opacity-30 grayscale">📉</span>
      {message}
    </div>
  );
}

function WeatherCard({ current: c }: { current?: WeatherCurrent }) {
  return (
    <Card className="bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] text-white shadow-lg shadow-blue-500/20 border-0 relative overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform duration-300">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none mix-blend-overlay">
        <Cloud size={160} />
      </div>
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <CardHeader className="pb-0 relative z-10 pt-5">
        <CardTitle className="text-[10px] flex items-center gap-2 text-white/90 font-black tracking-widest uppercase">
          <Cloud size={14} /> Current Atmosphere
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 relative z-10 flex-1 flex flex-col justify-between">
        {c ? (
          <>
            <div>
              <div className="flex items-center gap-5 mb-4">
                <div className="bg-white/20 rounded-3xl p-2.5 backdrop-blur-md shadow-inner border border-white/10">
                  <Image src={`https://openweathermap.org/img/wn/${c.icon}@2x.png`} alt={c.description} width={68} height={68} unoptimized className="drop-shadow-lg" />
                </div>
                <div>
                  <div className="text-5xl font-black tracking-tighter drop-shadow-md">{c.temperature.toFixed(0)}°</div>
                  <div className="text-base font-bold capitalize text-white/90 drop-shadow-sm mt-1">{c.description}</div>
                </div>
              </div>
              <div className="text-xs font-bold text-white/90 flex items-center gap-2 mt-4 bg-black/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                {c.city}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5 transition-colors hover:bg-black/30">
                <div className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Droplets size={12} className="text-blue-300"/> Humidity</div>
                <div className="font-black text-xl tracking-tight">{c.humidity}%</div>
              </div>
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5 transition-colors hover:bg-black/30">
                <div className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Wind size={12} className="text-teal-300"/> Wind</div>
                <div className="font-black text-xl tracking-tight">{c.wind_speed} <span className="text-[11px] font-bold text-white/60 lowercase tracking-wider">m/s</span></div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 text-white/70">
            <Cloud size={40} className="mb-4 opacity-50" />
            <p className="text-sm font-semibold leading-relaxed">Configure farm location<br/>to sync local weather</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
