'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { format } from 'date-fns';

interface ChartData {
  date?: string;
  timestamp?: string;
  moisture?: number;
  temperature?: number;
  ph?: number;
  humidity?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
}

interface SoilChartProps {
  data: ChartData[];
  type?: 'npk' | 'moisture' | 'all';
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-agri-100 rounded-xl shadow-xl p-3 text-sm">
      <p className="font-bold text-agri-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-600 capitalize">{p.name}:</span>
          <span className="font-semibold text-gray-800">{p.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

export function SoilTrendChart({ data, height = 280 }: SoilChartProps) {
  const formatted = data.map(d => ({
    ...d,
    time: d.date || d.timestamp
      ? format(new Date(d.date || d.timestamp!), 'MMM dd')
      : '',
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3dba6f" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3dba6f" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8f7ee" />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#5a7464' }} />
        <YAxis tick={{ fontSize: 11, fill: '#5a7464' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="avg_moisture" name="Moisture %" stroke="#3dba6f" fill="url(#moistureGrad)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="avg_temperature" name="Temperature °C" stroke="#f59e0b" fill="url(#tempGrad)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="avg_ph" name="pH" stroke="#3b82f6" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function NPKChart({ data, height = 260 }: SoilChartProps) {
  const formatted = data.map(d => ({
    ...d,
    time: d.date || d.timestamp
      ? format(new Date(d.date || d.timestamp!), 'MMM dd')
      : '',
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8f7ee" />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#5a7464' }} />
        <YAxis tick={{ fontSize: 11, fill: '#5a7464' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="avg_nitrogen"   name="Nitrogen (N)"   stroke="#1a5c2a" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="avg_phosphorus" name="Phosphorus (P)" stroke="#2d8c4e" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="avg_potassium"  name="Potassium (K)"  stroke="#3dba6f" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
