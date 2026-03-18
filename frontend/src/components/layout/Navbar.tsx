'use client';

import { useState, useCallback } from 'react';
import { Bell, LogOut, Settings, ChevronDown, Wifi, WifiOff, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import Link from 'next/link';

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
    <nav className="sticky top-0 z-50 h-[62px] bg-gradient-to-r from-agri-600 to-agri-500 text-white flex items-center justify-between px-6 shadow-lg">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl select-none">🌱</div>
        <div>
          <span className="text-lg font-extrabold tracking-tight">PrithviCore</span>
          <span className="ml-2 text-sm font-medium text-white/75 hidden sm:inline">Smart Farming System</span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {/* Live indicator */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
          ${connected ? 'bg-white/20' : 'bg-red-500/30'}`}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
          {connected && <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors border border-white/20"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-amber-400 rounded-full text-[9px] font-bold flex items-center justify-center text-agri-800">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute top-11 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-agri-100 p-4 animate-slide-up">
              <h4 className="font-bold text-sm text-agri-600 pb-2 border-b border-agri-100 mb-2">Notifications</h4>
              {alerts.length === 0 ? (
                <p className="text-sm text-gray-400 py-3 text-center">No new alerts</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alerts.map((a) => (
                    <div key={a.id} className="flex gap-2.5 items-start py-2 border-b border-gray-50 last:border-0">
                      <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        a.type === 'critical' ? 'bg-red-500' : a.type === 'high' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                      <div>
                        <p className="text-xs text-gray-700 leading-snug">{a.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
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
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 px-2 py-1 rounded-full transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-white text-agri-600 font-bold text-sm flex items-center justify-center select-none">
              {user ? user.name[0].toUpperCase() : '?'}
            </div>
            <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">{user?.name ?? 'Guest'}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>
          {profileOpen && (
            <div className="absolute top-11 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-agri-100 p-2 animate-slide-up">
              <Link href="/profile" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-agri-50 hover:text-agri-700 rounded-xl transition-colors">
                <User size={15} /> Profile
              </Link>
              <Link href="/settings" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-agri-50 hover:text-agri-700 rounded-xl transition-colors">
                <Settings size={15} /> Settings
              </Link>
              <div className="h-px bg-agri-100 my-1" />
              <button onClick={() => { setProfileOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
