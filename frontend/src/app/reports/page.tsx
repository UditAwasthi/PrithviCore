'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { FileBarChart, Download, Loader } from 'lucide-react';
import { format, subDays } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { reportsAPI, sensorAPI, diseaseAPI } from '@/lib/api';
import { SoilTrendChart } from '@/components/charts/SoilChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<'weekly' | 'monthly' | null>(null);

  const { data: sensor30, isLoading: sLoading } = useQuery('sensor-30', () =>
    sensorAPI.history({ from: subDays(new Date(), 30).toISOString(), to: new Date().toISOString(), limit: 200 }).then((r) => r.data)
  );
  const { data: diseaseData, isLoading: dLoading } = useQuery('disease-hist-report', () =>
    diseaseAPI.history({ limit: 30 }).then((r) => r.data)
  );

  const daily = (sensor30 as { daily_averages?: unknown[] })?.daily_averages ?? [];
  const diseaseResults = (diseaseData as { results?: unknown[] })?.results ?? [];
  const readingCount = (sensor30 as { readings?: unknown[] })?.readings?.length ?? 0;

  const download = async (type: 'weekly' | 'monthly') => {
    setDownloading(type);
    try {
      const res = await reportsAPI.download(type);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PrithviCore_${type}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${type} report downloaded!`);
    } catch {
      toast.error('Failed to generate report. Is the backend running?');
    } finally {
      setDownloading(null);
    }
  };

  const stats = [
    { label: 'Total Readings', value: readingCount, icon: '📊' },
    { label: 'Disease Scans', value: diseaseResults.length, icon: '🔬' },
    { label: 'Report Period', value: '30 Days', icon: '📅' },
    { label: 'Data Quality', value: readingCount > 10 ? 'Good' : 'Low', icon: '✅' },
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <FileBarChart size={26} className="text-emerald-500" /> Farm Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Generate comprehensive PDF reports and review aggregated farm metrics</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="text-2xl bg-background/60 backdrop-blur-sm p-2 rounded-xl border border-border/30">{s.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-black text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Download Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {(['weekly', 'monthly'] as const).map((type) => (
          <Card key={type} className={cn("transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300", type === 'monthly' ? 'bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/15' : '')}>
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground capitalize text-lg">{type} Report</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{type === 'weekly' ? 'Last 7 days summary' : 'Full month overview'}</p>
              </div>
              <Button onClick={() => download(type)} disabled={downloading === type}
                className={cn("gap-2 rounded-xl shadow-md px-5", type === 'monthly' ? '' : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:shadow-sky-500/20')}>
                {downloading === type ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                Download PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader className="pb-2 border-b border-border/20">
          <CardTitle className="text-base font-bold">30-Day Soil Trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {sLoading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : daily.length > 0 ? (
            <SoilTrendChart data={daily as Record<string, number | string>[]} height={260} />
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground bg-muted/15 rounded-xl border border-dashed border-border/30">
              <span className="text-2xl mb-2 opacity-30">📉</span>
              <p className="text-sm font-medium">No trend data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
