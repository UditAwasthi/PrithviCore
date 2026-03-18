'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { dashboardAPI, weatherAPI } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import AppLayout from '@/components/layout/AppLayout';
import { SoilTrendChart, NPKChart } from '@/components/charts/SoilChart';
import { formatDistanceToNow, format } from 'date-fns';
import { Search, Plus, Bell, MoreHorizontal, CheckCircle2, Cloud, Droplets, Thermometer, FlaskConical, Wind } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// --- Types ---
interface SensorReading { moisture: number; temperature: number; humidity: number; ph: number; nitrogen: number; phosphorus: number; potassium: number; timestamp: string; }
interface Recommendation { id: string; icon: string; title: string; action: string; priority: string; }
interface DiseaseResult { disease_name: string; severity: string; confidence: number; treatment: string; }
interface DashboardData { latest_reading: SensorReading | null; weekly_trend: Record<string, number | string>[]; recommendations: Recommendation[]; latest_disease: DiseaseResult | null; }
interface WeatherCurrent { temperature: number; description: string; humidity: number; wind_speed: number; icon: string; city: string; }

// --- Dummy Activity Log (Mapped to reference image 'Recent Activity') ---
const ACTIVITY_LOG = [
  { id: 1, user: 'Sarah Lee', action: 'Adjusted irrigation in Zone A', time: '10m ago', avatar: 'S' },
  { id: 2, user: 'Daniel Kim', action: 'Added new NPK records', time: '1h ago', avatar: 'D' },
  { id: 3, user: 'System', action: 'Automated pest scan completed', time: '3h ago', avatar: '⚙️' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: dash, isLoading, error } = useQuery<DashboardData>(
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
      {/* Top Header Row matching mockup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0] ?? 'Alex'}!
        </h1>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 md:w-64 shadow-sm"
            />
          </div>
          <Button variant="outline" className="gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm text-gray-700 dark:text-gray-200 hidden sm:flex">
            <Plus size={16} /> Add Widget
          </Button>
          <Button variant="outline" size="icon" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm text-gray-700 dark:text-gray-200">
            <Bell size={18} />
          </Button>
        </div>
      </div>

      {!!error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-8 text-destructive text-sm font-medium flex items-center gap-2">
          ⚠️ Could not load sensor data. Connect your IoT device.
        </div>
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        
        {/* KPI Row (4 standard cards with mini area charts) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Soil Moisture */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm border-gray-100 dark:border-border/50 bg-white dark:bg-card overflow-hidden h-full flex flex-col justify-between">
              <div className="p-5 pb-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Soil Moisture</span>
                  <Droplets size={16} className="text-gray-400" />
                </div>
                {isLoading ? <Skeleton className="h-10 w-24" /> : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{s?.moisture?.toFixed(1) ?? '—'}</span>
                    <span className="text-sm font-medium text-gray-500">%</span>
                  </div>
                )}
              </div>
              <div className="h-16 w-full mt-4">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,40 L0,30 C20,25 30,10 50,20 C70,30 80,5 100,10 L100,40 Z" fill="rgba(34,197,94,0.1)" />
                  <path d="M0,30 C20,25 30,10 50,20 C70,30 80,5 100,10" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="2" />
                </svg>
              </div>
            </Card>
          </motion.div>

          {/* Temperature / Weather */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm border-gray-100 dark:border-border/50 bg-white dark:bg-card overflow-hidden h-full flex flex-col justify-between">
              <div className="p-5 pb-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Temperature</span>
                  <Thermometer size={16} className="text-gray-400" />
                </div>
                {isLoading ? <Skeleton className="h-10 w-24" /> : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{s?.temperature?.toFixed(1) ?? weatherData?.current?.temperature?.toFixed(1) ?? '—'}</span>
                    <span className="text-sm font-medium text-gray-500">°C</span>
                  </div>
                )}
              </div>
              <div className="p-5 pt-2 grid grid-cols-3 gap-2 mt-2">
                {/* Dummy weather forecast icons replicating the visual density of the mockup */}
                {[...Array(6)].map((_, i) => (
                   <div key={i} className="flex flex-col items-center justify-center gap-1">
                     <Cloud size={14} className={i % 2 === 0 ? "text-primary/70" : "text-blue-400/70"} />
                     <span className="text-[9px] text-gray-400 font-semibold">{format(Date.now() + i*86400000, 'EEE')}</span>
                   </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Soil pH */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm border-gray-100 dark:border-border/50 bg-white dark:bg-card overflow-hidden h-full flex flex-col justify-between">
              <div className="p-5 pb-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Soil pH</span>
                  <FlaskConical size={16} className="text-gray-400" />
                </div>
                {isLoading ? <Skeleton className="h-10 w-24" /> : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{s?.ph?.toFixed(2) ?? '—'}</span>
                    <span className="text-sm font-medium text-gray-500">Index</span>
                  </div>
                )}
              </div>
              <div className="h-16 w-full mt-4">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,40 L0,20 C30,30 40,5 60,15 C80,25 90,5 100,10 L100,40 Z" fill="rgba(34,197,94,0.1)" />
                  <path d="M0,20 C30,30 40,5 60,15 C80,25 90,5 100,10" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="2" strokeDasharray="4 2"/>
                </svg>
              </div>
            </Card>
          </motion.div>

          {/* Crop Yield / Humidity */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm border-gray-100 dark:border-border/50 bg-white dark:bg-card overflow-hidden h-full flex flex-col justify-between">
              <div className="p-5 pb-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Humidity</span>
                  <Wind size={16} className="text-gray-400" />
                </div>
                {isLoading ? <Skeleton className="h-10 w-24" /> : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{s?.humidity?.toFixed(1) ?? '—'}</span>
                    <span className="text-sm font-medium text-gray-500">%</span>
                  </div>
                )}
              </div>
              <div className="h-16 w-full mt-4">
                <svg className="w-full h-full transform -scale-x-100" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,40 L0,30 C20,25 30,10 50,20 C70,30 80,5 100,10 L100,40 Z" fill="rgba(34,197,94,0.1)" />
                  <path d="M0,30 C20,25 30,10 50,20 C70,30 80,5 100,10" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="2" />
                </svg>
              </div>
            </Card>
          </motion.div>

        </div>

        {/* Middle Row (Charts)  */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="shadow-sm border-gray-100 dark:border-border/50 bg-white dark:bg-card h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Trend Overview</CardTitle>
                <select className="bg-transparent text-sm font-semibold text-gray-500 outline-none border-none cursor-pointer">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? <Skeleton className="h-[250px] w-full" /> : wkly.length > 0 ? <SoilTrendChart data={wkly} height={250} /> : (
                  <div className="h-[250px] w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed flex items-center justify-center text-gray-400 text-sm">No historical data</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="shadow-sm border-gray-100 dark:border-border/50 bg-white dark:bg-card h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">NPK Distribution</CardTitle>
                <MoreHorizontal size={18} className="text-gray-400 cursor-pointer" />
              </CardHeader>
              <CardContent className="pt-4 flex flex-col items-center">
                 {/* CSS Donut Chart replicating the mockup visual mapping to our NPK data*/}
                 <div className="relative w-48 h-48 mt-4 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {/* Base circle background */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="20" className="dark:stroke-gray-800" />
                      {/* N (Nitrogen) Segment */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="20" strokeDasharray={`${(s?.nitrogen ?? 33)/100 * 251} 251`} className="transition-all duration-1000"/>
                      {/* P (Phosphorus) Segment */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray={`${(s?.phosphorus ?? 33)/100 * 251} 251`} strokeDashoffset={`-${(s?.nitrogen ?? 33)/100 * 251}`} className="transition-all duration-1000" />
                      {/* K (Potassium) Segment */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" strokeWidth="20" strokeDasharray={`${(s?.potassium ?? 33)/100 * 251} 251`} strokeDashoffset={`-${((s?.nitrogen ?? 33) + (s?.phosphorus ?? 33))/100 * 251}`} className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-gray-900 dark:text-white">{Math.round((s?.nitrogen ?? 0) + (s?.phosphorus ?? 0) + (s?.potassium ?? 0))}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total NPK</span>
                    </div>
                 </div>
                 
                 <div className="w-full mt-8 flex justify-center gap-6">
                   <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300"><div className="w-3 h-3 rounded-full bg-[#22c55e]"/> N</div>
                   <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300"><div className="w-3 h-3 rounded-full bg-[#3b82f6]"/> P</div>
                   <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300"><div className="w-3 h-3 rounded-full bg-[#a855f7]"/> K</div>
                 </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          {/* Tasks Overview (Recommendations) */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm border-gray-100 dark:border-border/50 bg-white dark:bg-card h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Task Overview</CardTitle>
                <span className="text-sm font-semibold text-primary cursor-pointer hover:underline">View All</span>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-4">
                  {isLoading ? <Skeleton className="h-16 w-full rounded-xl" /> : recs.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">No pending tasks.</div>
                  ) : recs.slice(0, 4).map((r) => (
                    <div key={r.id} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent dark:border-border/50">
                      <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xl shrink-0">
                        {r.icon || '📝'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{r.title}</p>
                        <p className="text-xs text-gray-500 truncate">{r.action}</p>
                      </div>
                      <div className="flex items-center gap-2 mr-2">
                        <div className="px-2.5 py-1 bg-white dark:bg-gray-700 shadow-sm rounded border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-600 dark:text-gray-300">
                          Todo
                        </div>
                        <CheckCircle2 size={18} className="text-gray-300 hover:text-green-500 cursor-pointer transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm border-gray-100 dark:border-border/50 bg-white dark:bg-card h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</CardTitle>
                <MoreHorizontal size={18} className="text-gray-400 cursor-pointer" />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-4">
                  {ACTIVITY_LOG.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 bg-white dark:bg-card p-2 rounded-xl border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200 dark:border-blue-800">
                        {log.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{log.user}</p>
                        <p className="text-xs text-gray-500 truncate">{log.action}</p>
                      </div>
                      <div className="text-xs font-semibold text-gray-400">
                        {log.time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

      </motion.div>
    </AppLayout>
  );
}
