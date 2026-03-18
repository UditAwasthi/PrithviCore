'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { FileBarChart, Download, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { reportsAPI } from '@/lib/api';
import { SoilTrendChart, NPKChart } from '@/components/charts/SoilChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

interface DiseaseEvent { _id: string; disease_name: string; severity: string; confidence: number; timestamp: string; }
interface Summary {
  min_moisture?: number; max_moisture?: number; avg_moisture?: number;
  avg_temp?: number; avg_ph?: number; avg_nitrogen?: number; total_readings?: number;
}
interface ReportData {
  period?: { from: string; to: string; type: string };
  summary: Summary;
  daily_data: Record<string, number | string>[];
  disease_events: DiseaseEvent[];
}

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useQuery<ReportData>(
    'reports',
    () => reportsAPI.get({ type: 'weekly' }).then((r) => r.data as ReportData),
    { staleTime: 5 * 60_000 }
  );

  const summary  = data?.summary      ?? {};
  const daily    = data?.daily_data   ?? [];
  const diseases = data?.disease_events ?? [];

  const handleDownload = async (type: string) => {
    setDownloading(true);
    try {
      const res = await reportsAPI.download(type);
      const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `PrithviCore_Report_${type}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch {
      toast.error('Failed to download. Ensure backend is running.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <FileBarChart size={28} className="text-primary" /> System Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            Reporting Period: 
            <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">
              {data?.period
                ? `${format(new Date(data.period.from), 'MMM d')} – ${format(new Date(data.period.to), 'MMM d, yyyy')}`
                : `${format(subDays(new Date(), 7), 'MMM d')} – ${format(new Date(), 'MMM d, yyyy')}`}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          {(['weekly','monthly'] as const).map((t) => (
            <Button key={t} onClick={() => handleDownload(t)} disabled={downloading} className="font-bold shadow-sm">
              {downloading ? <Loader size={16} className="animate-spin mr-2" /> : <Download size={16} className="mr-2" />}
              {t.charAt(0).toUpperCase() + t.slice(1)} PDF
            </Button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Avg Moisture',    val: summary.avg_moisture  != null ? `${summary.avg_moisture.toFixed(1)}%`  : '–', icon: '💧' },
          { label: 'Avg Temperature', val: summary.avg_temp      != null ? `${summary.avg_temp.toFixed(1)}°C`     : '–', icon: '🌡️' },
          { label: 'Avg pH Level',    val: summary.avg_ph        != null ? summary.avg_ph.toFixed(2)              : '–', icon: '🧪' },
          { label: 'Avg Nitrogen',    val: summary.avg_nitrogen  != null ? `${summary.avg_nitrogen.toFixed(0)}`   : '–', icon: '🌿' },
          { label: 'Total Readings',  val: summary.total_readings != null ? String(summary.total_readings)        : '0', icon: '📊' },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm border-border/50">
            <CardContent className="p-5">
              <div className="text-2xl mb-3 drop-shadow-sm">{s.icon}</div>
              <div className="text-2xl font-black text-foreground">{isLoading ? <Skeleton className="h-8 w-16" /> : s.val}</div>
              <div className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-sm border-border/50 flex flex-col">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg font-bold">Soil Conditions (7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 min-h-[250px]">
            {isLoading ? <Skeleton className="h-[220px] w-full mt-2" /> : daily.length > 0 ? <SoilTrendChart data={daily} height={220} /> : <div className="mt-2"><EmptyChart /></div>}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 flex flex-col">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-lg font-bold">Nutrient Levels (7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 min-h-[250px]">
            {isLoading ? <Skeleton className="h-[220px] w-full mt-2" /> : daily.length > 0 ? <NPKChart data={daily} height={220} /> : <div className="mt-2"><EmptyChart /></div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Moisture range */}
        {summary.min_moisture != null && (
          <Card className="shadow-sm border-border/50 lg:col-span-1">
            <CardHeader className="pb-4 border-b border-border/30">
              <CardTitle className="text-base font-bold">Moisture Ranges</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col justify-center h-[calc(100%-65px)]">
              <div className="space-y-4">
                {[
                  { label: 'Minimum', val: `${summary.min_moisture?.toFixed(1)}%`, color: 'text-orange-500' },
                  { label: 'Average', val: `${summary.avg_moisture?.toFixed(1)}%`, color: 'text-primary' },
                  { label: 'Maximum', val: `${summary.max_moisture?.toFixed(1)}%`, color: 'text-blue-500' },
                ].map((m) => (
                  <div key={m.label} className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-center justify-between">
                    <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">{m.label}</div>
                    <div className={cn("text-xl font-black", m.color)}>{m.val}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disease events */}
        <Card className={cn("shadow-sm border-border/50 overflow-hidden", summary.min_moisture != null ? "lg:col-span-2" : "lg:col-span-3")}>
          <CardHeader className="border-b border-border bg-muted/20 pb-4">
             <CardTitle className="text-base font-bold flex items-center gap-2">Disease Events Detected</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {diseases.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl mb-4 shadow-inner">😌</div>
                <p className="font-bold text-foreground">No disease events recorded</p>
                <p className="text-sm mt-1">Your plants are showing no signs of distress in this period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar max-h-[300px]">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                      {['Disease','Severity','Confidence','Date'].map((h) => <th key={h} className="px-6 py-4">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {diseases.map((d) => (
                      <tr key={d._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">{d.disease_name}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                            d.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                            d.severity === 'high'     ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400')}>
                            {d.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{width: `${d.confidence*100}%`}}></div></div>
                             {(d.confidence * 100).toFixed(0)}%
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">{format(new Date(d.timestamp), 'MMM d, yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </AppLayout>
  );
}

function EmptyChart() {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
      <span className="text-3xl mb-3 grayscale opacity-50 font-medium drop-shadow-sm">📈</span>
      <p className="text-sm font-semibold">Insufficient temporal data array</p>
    </div>
  );
}
