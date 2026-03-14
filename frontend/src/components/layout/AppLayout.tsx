'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import toast from 'react-hot-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  message: string;
  time: string;
  type: string;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useWebSocket((msg) => {
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

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-agri-50">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">🌱</div>
          <p className="text-agri-600 font-semibold">Loading AgriDrishti…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar alerts={alerts} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 pb-12 overflow-y-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

