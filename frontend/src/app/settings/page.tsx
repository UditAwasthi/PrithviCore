'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Settings, Key, Globe, Activity, Copy, Check, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/AuthContext';
import { authAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const WS_URL   = process.env.NEXT_PUBLIC_WS_URL  || 'ws://localhost:5000';

export default function SettingsPage() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    authAPI.me()
      .then((r) => {
        const data = r.data as { user?: { api_key?: string } };
        setApiKey(data?.user?.api_key ?? user?._id ?? 'Not available');
      })
      .catch(() => { setApiKey(user?._id ?? 'Not available'); });
  }, [user]);

  const copy = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toast.success(`${label} copied!`);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const thresholds = [
    { label: 'Moisture Low', val: '< 20%', icon: '💧' },
    { label: 'Moisture High', val: '> 70%', icon: '💧' },
    { label: 'Temp High', val: '> 35°C', icon: '🌡️' },
    { label: 'Temp Low', val: '< 10°C', icon: '🌡️' },
    { label: 'pH Range', val: '5.5 – 8.0', icon: '🧪' },
    { label: 'Humidity High', val: '> 85%', icon: '🌫️' },
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Settings size={26} className="text-emerald-500" /> Integration Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your IoT hardware integration and view system alert thresholds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* API Credentials */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Key size={17} className="text-muted-foreground" /> API Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {[
              { label: 'API Key', val: apiKey || 'Loading…', icon: Key, sensitive: true },
              { label: 'Backend URL', val: `${BASE_URL}/api`, icon: Globe, sensitive: false },
              { label: 'WebSocket', val: WS_URL, icon: Activity, sensitive: false },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <item.icon size={12} /> {item.label}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5 text-sm font-mono min-w-0 overflow-hidden">
                    <span className="truncate text-foreground/80">
                      {item.sensitive && item.val.length > 8 ? `${item.val.slice(0, 8)}${'•'.repeat(24)}` : item.val}
                    </span>
                  </div>
                  <button
                    onClick={() => copy(item.val, item.label)}
                    className="flex-shrink-0 h-10 w-10 rounded-xl border border-border/50 bg-background/60 hover:bg-accent/50 hover:border-primary/30 flex items-center justify-center transition-all duration-300 active:scale-95"
                    aria-label={`Copy ${item.label}`}
                  >
                    {copiedField === item.label ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} className="text-muted-foreground" />}
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-sky-500/5 rounded-xl p-4 text-sm border border-sky-500/15 mt-2">
              <p className="font-semibold text-foreground mb-1 text-sm flex items-center gap-1.5">
                <span className="text-lg">🔧</span> Quick Setup
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Flash these credentials to your ESP32 or Arduino device. Data will stream automatically to your PrithviCore dashboard.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Thresholds */}
        <Card>
          <CardHeader className="pb-3 border-b border-border/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle size={17} className="text-amber-500" /> Alert Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-4">Alerts are triggered when sensor values exceed these thresholds.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {thresholds.map((t) => (
                <div key={t.label} className="flex items-center justify-between bg-muted/15 rounded-xl p-3.5 border border-border/20 hover:border-primary/20 transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-sm font-medium text-foreground">{t.label}</span>
                  </div>
                  <span className={cn("text-sm font-bold px-2.5 py-0.5 rounded-lg",
                    t.label.includes('High') ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/15" :
                    t.label.includes('Low') ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/15" :
                    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/15"
                  )}>{t.val}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 bg-amber-500/5 rounded-xl p-4 border border-amber-500/15">
              <p className="text-sm text-foreground font-semibold flex items-center gap-1.5 mb-1">
                <AlertTriangle size={14} className="text-amber-500" /> About thresholds
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Thresholds are applied server-side. Real-time WebSocket alerts are pushed when readings cross these boundaries.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
