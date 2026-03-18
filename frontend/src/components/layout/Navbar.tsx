'use client';

import { useState, useCallback } from 'react';
import { Bell, LogOut, Settings, ChevronDown, Wifi, WifiOff, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

interface Alert { id: string; message: string; time: string; type: string; }
interface NavbarProps { alerts?: Alert[]; }

export default function Navbar({ alerts = [] }: NavbarProps) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);

  // Stable no-op handler — Navbar doesn't process WS messages, only shows status
  const noop = useCallback(() => {}, []);
  const { connected } = useWebSocket(noop);

  const unread = alerts.length;

  return (
    <nav className="sticky top-0 z-50 h-[62px] bg-background/80 backdrop-blur-md border-b border-border text-foreground flex items-center justify-between px-6 shadow-sm transition-colors">
      <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xl select-none shadow-sm shadow-primary/30">🌿</div>
        <div>
          <span className="text-lg font-extrabold tracking-tight">PrithviCore</span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
          connected ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'
        )}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
          {connected && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
        </div>
        
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
            aria-label="Notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent text-foreground transition-colors"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold flex items-center justify-center text-destructive-foreground">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute top-12 right-0 w-80 bg-popover text-popover-foreground rounded-xl shadow-lg border border-border p-4 animate-slide-up">
              <h4 className="font-bold text-sm pb-2 border-b border-border mb-2">Notifications</h4>
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">No new alerts</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alerts.map((a) => (
                    <div key={a.id} className="flex gap-3 items-start py-2 border-b border-border/50 last:border-0">
                      <span className={cn(
                        "mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0",
                        a.type === 'critical' ? 'bg-destructive' : a.type === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                      )} />
                      <div>
                        <p className="text-xs leading-snug">{a.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-2 hover:bg-accent px-2 py-1 rounded-full transition-colors border border-transparent hover:border-border"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center select-none shadow-sm">
              {user ? user.name[0].toUpperCase() : '?'}
            </div>
            <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">{user?.name ?? 'Guest'}</span>
            <ChevronDown size={14} className={cn("text-muted-foreground transition-transform duration-200", profileOpen && "rotate-180")} />
          </button>
          {profileOpen && (
            <div className="absolute top-12 right-0 w-48 bg-popover text-popover-foreground rounded-xl shadow-lg border border-border p-2 animate-slide-up">
              <Link href="/profile" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors">
                <User size={15} /> Profile
              </Link>
              <Link href="/settings" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors">
                <Settings size={15} /> Settings
              </Link>
              <div className="h-px bg-border my-1" />
              <button onClick={() => { setProfileOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
