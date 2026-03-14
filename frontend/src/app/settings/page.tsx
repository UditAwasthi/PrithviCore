'use client';

import { Settings } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  const apiKey = user ? `AGD-${user._id.slice(-12).toUpperCase()}` : 'AGD-YOUR_DEVICE_KEY';
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://agridrishti-project.onrender.com'}/api/sensor-data`;
  const wsUrl  = process.env.NEXT_PUBLIC_WS_URL ?? 'wss://agridrishti-project.onrender.com';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${label} copied to clipboard!`);
    }).catch(() => {/* ignore */});
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-agri-700 flex items-center gap-2"><Settings size={24} /> Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your device and notification preferences</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Device API Key */}
        <div className="bg-white rounded-2xl border border-agri-100 p-6 shadow-sm">
          <h3 className="font-bold text-agri-700 mb-1">IoT Device API Key</h3>
          <p className="text-sm text-gray-400 mb-4">Paste this key as <code className="bg-gray-100 px-1 rounded text-xs">API_KEY</code> in your ESP32 firmware</p>
          <div className="bg-agri-50 border border-agri-200 rounded-xl p-4 font-mono text-sm text-agri-700 flex items-center justify-between gap-3 break-all">
            <span>{apiKey}</span>
            <button onClick={() => copyToClipboard(apiKey, 'API key')}
              className="flex-shrink-0 text-xs text-agri-500 hover:text-agri-700 font-semibold border border-agri-200 px-2 py-1 rounded-lg hover:bg-agri-100 transition-colors">
              Copy
            </button>
          </div>
        </div>

        {/* Backend URL */}
        <div className="bg-white rounded-2xl border border-agri-100 p-6 shadow-sm">
          <h3 className="font-bold text-agri-700 mb-1">Backend Sensor Endpoint</h3>
          <p className="text-sm text-gray-400 mb-4">Use as <code className="bg-gray-100 px-1 rounded text-xs">API_URL</code> in your firmware</p>
          <div className="bg-agri-50 border border-agri-200 rounded-xl p-4 font-mono text-sm text-agri-700 flex items-center justify-between gap-3 break-all">
            <span>{apiUrl}</span>
            <button onClick={() => copyToClipboard(apiUrl, 'API URL')}
              className="flex-shrink-0 text-xs text-agri-500 hover:text-agri-700 font-semibold border border-agri-200 px-2 py-1 rounded-lg hover:bg-agri-100 transition-colors">
              Copy
            </button>
          </div>
        </div>

        {/* Alert thresholds */}
        <div className="bg-white rounded-2xl border border-agri-100 p-6 shadow-sm">
          <h3 className="font-bold text-agri-700 mb-4">Alert Thresholds</h3>
          <div className="space-y-3">
            {[
              { label: 'Soil Moisture Critical', value: '< 20%',     color: 'text-red-600' },
              { label: 'Soil Moisture Low',       value: '< 35%',     color: 'text-amber-600' },
              { label: 'Temperature Heat Stress', value: '> 35°C',   color: 'text-red-600' },
              { label: 'pH Acidic',               value: '< 5.5',    color: 'text-orange-600' },
              { label: 'pH Alkaline',             value: '> 8.0',    color: 'text-orange-600' },
              { label: 'Nitrogen Low',            value: '< 50 mg/kg', color: 'text-amber-600' },
              { label: 'Humidity Fungal Risk',    value: '> 85%',    color: 'text-amber-600' },
            ].map((t) => (
              <div key={t.label} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-600">{t.label}</span>
                <span className={`font-bold ${t.color}`}>{t.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WebSocket */}
        <div className="bg-white rounded-2xl border border-agri-100 p-6 shadow-sm">
          <h3 className="font-bold text-agri-700 mb-1">Real-time Connection</h3>
          <p className="text-sm text-gray-400 mb-3">Dashboard auto-updates when sensor data arrives</p>
          <div className="text-sm text-agri-600 bg-agri-50 rounded-xl p-3 font-mono break-all">
            WebSocket: {wsUrl}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
