'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import toast from 'react-hot-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';
import { Leaf } from 'lucide-react';

interface Alert {
  id: string;
  message: string;
  time: string;
  type: string;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const ws = useWebSocket((msg) => {
    if (msg.event === 'disease_alert') {
      const d = msg.data as {
        disease: string;
        confidence: number;
        severity: string;
      };
      const alert: Alert = {
        id: Date.now().toString(),
        message: `🔬 Disease detected: ${d.disease} (${(d.confidence * 100).toFixed(0)}% confidence)`,
        time: formatDistanceToNow(new Date(), { addSuffix: true }),
        type: d.severity === 'critical' ? 'critical' : 'high',
      };
      setAlerts((prev) => [alert, ...prev].slice(0, 20));
      toast.error(`⚠️ ${d.disease} detected on your farm!`);
    }
  });

  // Log WebSocket errors for debugging
  useEffect(() => {
    if (ws.error) {
      console.error('[WS] Connection error:', ws.error);
    }
  }, [ws.error]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 animate-pulse shadow-lg shadow-emerald-500/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Leaf size={28} className="text-white" />
            </div>
          </div>
          <p className="text-primary font-semibold text-base tracking-tight">Loading PrithviCore…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-primary/20 relative z-0">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none -z-10 mesh-gradient opacity-60" />
      
      {/* Subtle noise texture */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.015] dark:opacity-[0.03]" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      <Sidebar />
      
      {/* Main wrapper */}
      <div className="md:ml-[260px] flex flex-col min-h-screen w-full md:w-[calc(100%-260px)] transition-all">
        <Navbar 
          alerts={alerts} 
          onClearAlerts={() => setAlerts([])} 
        />
        
        <main className="flex-1 p-5 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
