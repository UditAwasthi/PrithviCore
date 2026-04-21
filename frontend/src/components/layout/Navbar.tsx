'use client';

import { useState, useCallback } from 'react';
import { Bell, LogOut, Settings, ChevronDown, Wifi, WifiOff, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import NotificationDrawer from '@/components/ui/NotificationDrawer';

interface Alert { id: string; message: string; time: string; type: string; }
interface NavbarProps { 
  alerts?: Alert[]; 
  onClearAlerts?: () => void;
}

export default function Navbar({ alerts = [], onClearAlerts }: NavbarProps) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);

  const noop = useCallback(() => {}, []);
  const { connected, error, reconnect } = useWebSocket(noop);

  const unread = alerts.length;

  return (
    <nav className="sticky top-0 z-40 h-[68px] bg-background/70 backdrop-blur-2xl border-b border-border/30 flex items-center justify-between px-6 transition-colors">
      {/* Left side - mobile brand */}
      <div className="flex items-center">
        <span className="text-lg font-bold tracking-tight md:hidden text-foreground">PrithviCore</span>
      </div>

      {/* Right side - actions */}
      <div className="flex items-center gap-2">
        {/* Live Status */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all duration-300",
          connected
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
        )}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
          {connected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        </div>

        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(true); setProfileOpen(false); }}
            aria-label="Notifications"
            className="relative h-10 w-10 flex items-center justify-center rounded-full border border-border/30 bg-background/60 backdrop-blur-sm hover:bg-accent/50 hover:border-primary/30 text-foreground transition-all duration-300"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white shadow-lg shadow-red-500/30 ring-2 ring-background">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          
          <NotificationDrawer 
            isOpen={notifOpen}
            onClose={() => setNotifOpen(false)}
            notifications={alerts}
            onClearAll={() => {
              onClearAlerts?.();
              setNotifOpen(false);
            }}
          />
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-2 h-10 pl-1 pr-3 rounded-full border border-border/30 bg-background/60 backdrop-blur-sm hover:bg-accent/50 hover:border-primary/30 transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-white font-bold text-sm flex items-center justify-center select-none shadow-sm">
              {user ? user.name[0].toUpperCase() : '?'}
            </div>
            <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate text-foreground">{user?.name ?? 'Guest'}</span>
            <ChevronDown size={14} className={cn("text-muted-foreground transition-transform duration-200", profileOpen && "rotate-180")} />
          </button>
          {profileOpen && (
            <div className="absolute top-12 right-0 w-48 bg-popover/95 backdrop-blur-xl text-popover-foreground rounded-2xl shadow-2xl border border-border/30 p-1.5 animate-slide-up ring-1 ring-white/10">
              <Link href="/profile" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent/50 rounded-xl transition-colors font-medium">
                <User size={15} className="text-muted-foreground" /> Profile
              </Link>
              <Link href="/settings" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent/50 rounded-xl transition-colors font-medium">
                <Settings size={15} className="text-muted-foreground" /> Settings
              </Link>
              <div className="h-px bg-border/30 my-1" />
              <button onClick={() => { setProfileOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-medium">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

