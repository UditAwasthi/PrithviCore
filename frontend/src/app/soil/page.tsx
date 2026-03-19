'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { subDays, format } from 'date-fns';
import { Leaf } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { sensorAPI } from '@/lib/api';
import { SoilTrendChart, NPKChart } from '@/components/charts/SoilChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

const RANGES = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
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
    () => sensorAPI.history({ from: subDays(new Date(), range).toISOString(), to: new Date().toISOString(), limit: 500 }).then((r) => r.data),
    { refetchInterval: 60_000 }
  );

  const { data: latestData } = useQuery('soil-latest', () => sensorAPI.latest().then((r) => r.data));

  const latest = latestData as SensorRow | undefined;
  const daily = (data as { daily_averages?: unknown[] })?.daily_averages ?? [];
  const readings = (data as { readings?: SensorRow[] })?.readings ?? [];

  const metrics = [
    { label: 'Moisture', key: 'moisture', unit: '%', icon: '💧', decimals: 1 },
    { label: 'Temp', key: 'temperature', unit: '°C', icon: '🌡️', decimals: 1 },
    { label: 'Humidity', key: 'humidity', unit: '%', icon: '🌫️', decimals: 1 },
    { label: 'pH', key: 'ph', unit: 'pH', icon: '🧪', decimals: 2 },
    { label: 'Nitrogen', key: 'nitrogen', unit: 'mg/kg', icon: '🌿', decimals: 0 },
    { label: 'Phosphorus', key: 'phosphorus', unit: 'mg/kg', icon: '🌾', decimals: 0 },
    { label: 'Potassium', key: 'potassium', unit: 'mg/kg', icon: '🍂', decimals: 0 },
  ] as const;

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Leaf size={26} className="text-emerald-500" /> Soil Metrics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Deep dive into historical sensor readings and analytical trends</p>
        </div>
        <div className="flex gap-1 bg-muted/40 p-1 rounded-full border border-border/30 mt-2 sm:mt-0 w-fit">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setRange(r.days)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all uppercase tracking-wider",
                range === r.days ? "bg-background text-foreground shadow-sm border border-border/30" : "text-muted-foreground hover:text-foreground"
              )}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
         {metrics.map((m) => (
           <Card key={m.key} className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
             <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
               <div className="text-xl mb-1.5 group-hover:scale-110 transition-transform">{m.icon}</div>
               <div className="text-lg font-black text-foreground">
                 {latest && latest[m.key] != null ? (latest[m.key] as number).toFixed(m.decimals) : '–'}
                 <span className="text-[10px] font-semibold ml-1 text-muted-foreground uppercase">{m.unit}</span>
               </div>
               <div className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">{m.label}</div>
             </CardContent>
           </Card>
         ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">
        <Card className="flex flex-col">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-base font-bold">Moisture, Temperature & pH</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 flex-1 min-h-[280px]">
            {isLoading ? <Skeleton className="h-[240px] w-full mt-2" /> : daily.length > 0 ? <SoilTrendChart data={daily as Record<string, number | string>[]} height={240} /> : <EmptyState />}
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="pb-2 border-b border-border/20">
            <CardTitle className="text-base font-bold">NPK Nutrient Flow</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 flex-1 min-h-[280px]">
            {isLoading ? <Skeleton className="h-[240px] w-full mt-2" /> : daily.length > 0 ? <NPKChart data={daily as Record<string, number | string>[]} height={240} /> : <EmptyState />}
          </CardContent>
        </Card>
      </div>

      {/* Raw Data Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/20 bg-muted/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">Raw Readings <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">{readings.length}</span></CardTitle>
            <span className="text-xs text-muted-foreground">Showing latest {Math.min(readings.length, 100)}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {readings.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground flex flex-col items-center">
              <span className="text-3xl mb-2 opacity-30">📂</span>
              <span className="text-sm font-medium">No data points in this period</span>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[450px]">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    {['Timestamp','Moisture','Temp','Humidity','pH','N','P','K'].map((h) => (
                      <th key={h} className="px-5 py-3.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {readings.slice(0, 100).map((r, i) => (
                    <tr key={r._id} className={cn("hover:bg-muted/20 transition-colors", i % 2 === 0 ? '' : 'bg-muted/5')}>
                      <td className="px-5 py-3 text-muted-foreground text-xs font-medium">{format(new Date(r.timestamp), 'MMM d, HH:mm')}</td>
                      <td className="px-5 py-3 font-semibold text-blue-600 dark:text-blue-400">{r.moisture?.toFixed(1)}<span className="text-[10px] text-muted-foreground">%</span></td>
                      <td className="px-5 py-3 font-semibold text-orange-600 dark:text-orange-400">{r.temperature?.toFixed(1)}<span className="text-[10px] text-muted-foreground">°C</span></td>
                      <td className="px-5 py-3 font-medium text-foreground/80">{r.humidity?.toFixed(1)}<span className="text-[10px] text-muted-foreground">%</span></td>
                      <td className="px-5 py-3 font-bold text-violet-600 dark:text-violet-400">{r.ph?.toFixed(2)}</td>
                      <td className="px-5 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{r.nitrogen?.toFixed(0)}</td>
                      <td className="px-5 py-3 font-semibold text-amber-600 dark:text-amber-400">{r.phosphorus?.toFixed(0)}</td>
                      <td className="px-5 py-3 font-semibold text-sky-600 dark:text-sky-400">{r.potassium?.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}

function EmptyState() {
  return (
    <div className="h-[240px] flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/30">
      <span className="text-3xl mb-2 opacity-30">📉</span>
      <p className="text-sm font-medium">No data in this range</p>
      <p className="text-xs opacity-60 mt-1">Try expanding the timeline.</p>
    </div>
  );
}
