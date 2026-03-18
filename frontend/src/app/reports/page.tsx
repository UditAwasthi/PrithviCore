'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { FileBarChart, Download, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { reportsAPI } from '@/lib/api';
import { SoilTrendChart, NPKChart } from '@/components/charts/SoilChart';

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-agri-700 flex items-center gap-2"><FileBarChart size={24} /> Farm Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.period
              ? `${format(new Date(data.period.from), 'MMM d')} – ${format(new Date(data.period.to), 'MMM d, yyyy')}`
              : `${format(subDays(new Date(), 7), 'MMM d')} – ${format(new Date(), 'MMM d, yyyy')}`}
          </p>
        </div>
        <div className="flex gap-3">
          {(['weekly','monthly'] as const).map((t) => (
            <button key={t} onClick={() => handleDownload(t)} disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-agri-600 text-white rounded-xl hover:bg-agri-700 transition-colors disabled:opacity-60">
              {downloading ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
              {t.charAt(0).toUpperCase() + t.slice(1)} PDF
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Avg Moisture',    val: summary.avg_moisture  != null ? `${summary.avg_moisture.toFixed(1)}%`  : '–', icon: '💧' },
          { label: 'Avg Temperature', val: summary.avg_temp      != null ? `${summary.avg_temp.toFixed(1)}°C`     : '–', icon: '🌡️' },
          { label: 'Avg pH',          val: summary.avg_ph        != null ? summary.avg_ph.toFixed(2)              : '–', icon: '🧪' },
          { label: 'Avg Nitrogen',    val: summary.avg_nitrogen  != null ? `${summary.avg_nitrogen.toFixed(0)}`   : '–', icon: '🌿' },
          { label: 'Total Readings',  val: summary.total_readings != null ? String(summary.total_readings)        : '0', icon: '📊' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-agri-100 p-4 shadow-sm">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-xl font-extrabold text-agri-700">{isLoading ? '…' : s.val}</div>
            <div className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-agri-100 p-5 shadow-sm">
          <h3 className="font-bold text-agri-700 mb-4">Soil Conditions This Week</h3>
          {isLoading ? <div className="h-56 bg-agri-50 rounded-xl animate-pulse" />
            : daily.length > 0 ? <SoilTrendChart data={daily} height={220} /> : <EmptyChart />}
        </div>
        <div className="bg-white rounded-2xl border border-agri-100 p-5 shadow-sm">
          <h3 className="font-bold text-agri-700 mb-4">Nutrient Levels This Week</h3>
          {isLoading ? <div className="h-56 bg-agri-50 rounded-xl animate-pulse" />
            : daily.length > 0 ? <NPKChart data={daily} height={220} /> : <EmptyChart />}
        </div>
      </div>

      {/* Moisture range */}
      {summary.min_moisture != null && (
        <div className="bg-white rounded-2xl border border-agri-100 p-5 shadow-sm mb-6">
          <h3 className="font-bold text-agri-700 mb-4">Moisture Range Analysis</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Minimum', val: `${summary.min_moisture?.toFixed(1)}%`, color: 'text-red-600' },
              { label: 'Average', val: `${summary.avg_moisture?.toFixed(1)}%`, color: 'text-agri-600' },
              { label: 'Maximum', val: `${summary.max_moisture?.toFixed(1)}%`, color: 'text-blue-600' },
            ].map((m) => (
              <div key={m.label} className="bg-agri-50 rounded-xl p-4">
                <div className={`text-2xl font-extrabold ${m.color}`}>{m.val}</div>
                <div className="text-xs text-gray-400 font-medium mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disease events */}
      <div className="bg-white rounded-2xl border border-agri-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-agri-50">
          <h3 className="font-bold text-agri-700">Disease Events This Period</h3>
        </div>
        {diseases.length === 0 ? (
          <div className="py-10 text-center text-gray-300"><div className="text-3xl mb-2">✅</div><p className="text-sm">No disease events recorded</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-gray-50">
                {['Disease','Severity','Confidence','Date'].map((h) => <th key={h} className="text-left px-4 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {diseases.map((d) => (
                <tr key={d._id} className="border-b border-gray-50 hover:bg-agri-50/20 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-800">{d.disease_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                      d.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      d.severity === 'high'     ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                      {d.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{(d.confidence * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-gray-400">{format(new Date(d.timestamp), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}

function EmptyChart() {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-gray-300">
      <span className="text-3xl mb-2">📊</span><p className="text-sm">No data available</p>
    </div>
  );
}
