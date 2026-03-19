'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Leaf, Bug, Lightbulb,
  FileBarChart, Settings, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard',       label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/soil',            label: 'Soil Data',         icon: Leaf },
  { href: '/disease',         label: 'Disease Detection', icon: Bug },
  { href: '/recommendations', label: 'Recommendations',   icon: Lightbulb },
  { href: '/reports',         label: 'Reports',           icon: FileBarChart },
];

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/profile',  label: 'Profile',  icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  const NavItem = ({ href, label, Icon }: { href: string; label: string; Icon: React.ElementType }) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={cn(
          'group relative flex items-center gap-3 px-4 py-3 rounded-xl mx-3 text-[14px] font-medium transition-all duration-300',
          active
            ? 'bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.08)]'
            : 'text-white/55 hover:bg-white/8 hover:text-white/90'
        )}
      >
        {/* Active indicator bar */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
        )}
        <Icon size={19} className={cn('flex-shrink-0 transition-all duration-300', active ? 'text-emerald-400' : 'text-white/40 group-hover:text-white/80')} />
        <span className="flex-1 truncate">{label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-[260px] bg-gradient-to-b from-[#071a10] via-[#0a2418] to-[#050d09] border-r border-white/[0.06] flex-col flex-shrink-0 transition-transform hidden md:flex z-50 shadow-2xl">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-emerald-500/[0.04] to-transparent pointer-events-none" />

      {/* Brand Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/[0.06] relative z-10">
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Leaf size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">PrithviCore</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 space-y-1 overflow-y-auto relative z-10">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/[0.06] space-y-1 relative z-10">
        {BOTTOM_ITEMS.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />
        ))}
        {/* Version badge */}
        <div className="flex items-center justify-center mt-3 pt-3 border-t border-white/[0.04]">
          <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">v1.0 · PrithviCore</span>
        </div>
      </div>
    </aside>
  );
}
