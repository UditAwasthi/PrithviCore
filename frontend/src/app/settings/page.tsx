'use client';

import { Settings, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const apiKey = user ? `PC-${user._id.slice(-12).toUpperCase()}` : 'PC-YOUR_DEVICE_KEY';
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://prithvicore-project.onrender.com'}/api/sensor-data`;
  const wsUrl  = process.env.NEXT_PUBLIC_WS_URL ?? 'wss://prithvicore-project.onrender.com';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(label);
      toast.success(`${label} copied!`, { icon: '📋' });
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => toast.error('Failed to copy'));
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <Settings size={28} className="text-primary" /> Integrations & Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your IoT hardware connection and system preferences</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Device API Key */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3">
               <CardTitle className="text-lg font-bold">IoT Device API Key</CardTitle>
               <p className="text-sm text-muted-foreground mt-1">Paste this key as <code className="bg-muted px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold text-foreground">API_KEY</code> in your ESP32 or Raspberry Pi firmware</p>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/40 border border-border/60 rounded-xl p-4 flex items-center justify-between gap-4 group transition-colors hover:bg-muted/60">
                <span className="font-mono text-sm font-semibold text-foreground tracking-wider break-all">{apiKey}</span>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiKey, 'API_KEY')}
                  className="flex-shrink-0 h-8 text-xs font-bold gap-1.5 min-w-[80px]">
                  {copiedKey === 'API_KEY' ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />} 
                  {copiedKey === 'API_KEY' ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Backend URL */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3">
               <CardTitle className="text-lg font-bold">Backend Sensor Endpoint</CardTitle>
               <p className="text-sm text-muted-foreground mt-1">Use as <code className="bg-muted px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold text-foreground">API_URL</code> in your hardware HTTP configurations</p>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/40 border border-border/60 rounded-xl p-4 flex items-center justify-between gap-4 group transition-colors hover:bg-muted/60">
                <span className="font-mono text-[13px] font-semibold text-foreground tracking-tight truncate" title={apiUrl}>{apiUrl}</span>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiUrl, 'API_URL')}
                  className="flex-shrink-0 h-8 text-xs font-bold gap-1.5 min-w-[80px]">
                  {copiedKey === 'API_URL' ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />} 
                  {copiedKey === 'API_URL' ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* WebSocket */}
          <Card className="shadow-sm border-border/50 bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
               <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse" />
                 Real-time Telemetry
               </CardTitle>
               <p className="text-sm text-foreground/80 font-medium">Dashboard connection endpoint for real-time sensor updates.</p>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-mono font-bold text-primary/80 bg-background/50 border border-primary/10 rounded-xl p-3 truncate" title={wsUrl}>
                {wsUrl}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1">
          {/* Alert thresholds */}
          <Card className="shadow-sm border-border/50 h-full">
            <CardHeader className="pb-4 border-b border-border/30">
               <CardTitle className="text-base font-bold">System Alert Thresholds</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {[
                  { label: 'Moisture (Critical)', value: '< 20%', color: 'text-destructive bg-destructive/10 border-destructive/20' },
                  { label: 'Moisture (Low)',      value: '< 35%', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
                  { label: 'Temp (Heat Stress)',  value: '> 35°C', color: 'text-destructive bg-destructive/10 border-destructive/20' },
                  { label: 'pH (Acidic Risk)',    value: '< 5.5', color: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20' },
                  { label: 'pH (Alkaline Risk)',  value: '> 8.0', color: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20' },
                  { label: 'Nitrogen (Deficit)',  value: '< 50 mg', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
                  { label: 'Humidity (Fungal)',   value: '> 85%', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
                ].map((t) => (
                  <div key={t.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/20 px-2 rounded-lg transition-colors">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.label}</span>
                    <span className={cn("text-xs font-black px-2 py-0.5 rounded-md border text-right inline-block w-fit", t.color)}>{t.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
