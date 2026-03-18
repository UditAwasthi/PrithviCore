'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { subDays, format } from 'date-fns';
import { Leaf } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { sensorAPI } from '@/lib/api';
import { SoilTrendChart, NPKChart } from '@/components/charts/SoilChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

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
    { label: 'Temp',        key: 'temperature', unit: '°C',    icon: '🌡️', decimals: 1 },
    { label: 'Humidity',    key: 'humidity',    unit: '%',     icon: '🌫️', decimals: 1 },
    { label: 'pH Level',    key: 'ph',          unit: 'pH',    icon: '🧪', decimals: 2 },
    { label: 'Nitrogen',    key: 'nitrogen',    unit: 'mg/kg', icon: '🌿', decimals: 0 },
    { label: 'Phosphorus',  key: 'phosphorus',  unit: 'mg/kg', icon: '🌾', decimals: 0 },
    { label: 'Potassium',   key: 'potassium',   unit: 'mg/kg', icon: '🍂', decimals: 0 },
  ] as const;

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Leaf size={28} className="text-primary" /> Soil Metrics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Deep dive into historical sensor readings and analytical trends</p>
        </div>
        <div className="flex gap-2 bg-muted/50 p-1.5 rounded-full border border-border mt-2 sm:mt-0 w-fit">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setRange(r.days)}
              className={cn(
                "px-5 py-1.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider",
                range === r.days ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
         {metrics.map((m) => (
           <Card key={m.key} className="shadow-sm border-border/50 hover:border-primary/30 transition-colors group">
             <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
               <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{m.icon}</div>
               <div className="text-xl font-black text-foreground drop-shadow-sm">
                 {latest && latest[m.key] != null ? (latest[m.key] as number).toFixed(m.decimals) : '–'}
                 <span className="text-xs font-bold ml-1 text-muted-foreground tracking-widest uppercase">{m.unit}</span>
               </div>
               <div className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">{m.label}</div>
             </CardContent>
           </Card>
         ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-sm border-border/50 flex flex-col">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg font-bold">Moisture, Temperature & pH Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 min-h-[300px]">
            {isLoading ? <Skeleton className="h-[260px] w-full mt-2" /> : daily.length > 0 ? <SoilTrendChart data={daily as Record<string, number | string>[]} height={260} /> : <div className="mt-2"><EmptyState /></div>}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 flex flex-col">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg font-bold">NPK Nutrient Flow</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 min-h-[300px]">
            {isLoading ? <Skeleton className="h-[260px] w-full mt-2" /> : daily.length > 0 ? <NPKChart data={daily as Record<string, number | string>[]} height={260} /> : <div className="mt-2"><EmptyState /></div>}
          </CardContent>
        </Card>
      </div>

      {/* Raw readings table */}
      <Card className="shadow-sm border-border/50 overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">Raw Readings Database <span className="text-xs font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">{readings.length} total</span></CardTitle>
            <span className="text-xs font-medium text-muted-foreground">Showing latest {Math.min(readings.length, 100)} row(s)</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {readings.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground font-medium flex flex-col items-center">
              <span className="text-4xl mb-3 grayscale opacity-50">📂</span>
              No data points recorded during this period
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                    {['Timestamp','Moisture','Temp','Humidity','pH','N (mg/kg)','P (mg/kg)','K (mg/kg)'].map((h) => (
                      <th key={h} className="px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {readings.slice(0, 100).map((r, i) => (
                    <tr key={r._id} className={cn("hover:bg-muted/30 transition-colors", i % 2 === 0 ? 'bg-transparent' : 'bg-muted/10')}>
                      <td className="px-6 py-3 font-medium text-muted-foreground text-xs">{format(new Date(r.timestamp), 'MMM d, HH:mm')}</td>
                      <td className="px-6 py-3 font-bold text-blue-600 dark:text-blue-400">{r.moisture?.toFixed(1)}<span className="text-[10px] text-muted-foreground">%</span></td>
                      <td className="px-6 py-3 font-bold text-orange-600 dark:text-orange-400">{r.temperature?.toFixed(1)}<span className="text-[10px] text-muted-foreground">°C</span></td>
                      <td className="px-6 py-3 font-semibold text-foreground/80">{r.humidity?.toFixed(1)}<span className="text-[10px] text-muted-foreground">%</span></td>
                      <td className="px-6 py-3 font-black text-purple-600 dark:text-purple-400 bg-purple-500/5">{r.ph?.toFixed(2)}</td>
                      <td className="px-6 py-3 font-bold text-primary">{r.nitrogen?.toFixed(0)}</td>
                      <td className="px-6 py-3 font-bold text-amber-600 dark:text-amber-500">{r.phosphorus?.toFixed(0)}</td>
                      <td className="px-6 py-3 font-bold text-blue-500">{r.potassium?.toFixed(0)}</td>
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
    <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
      <span className="text-4xl mb-3 grayscale opacity-50 drop-shadow-sm">📉</span>
      <p className="text-sm font-semibold">No data variations located</p>
      <p className="text-xs opacity-70 mt-1">Expanding your timeline range may yield more data.</p>
    </div>
  );
}
