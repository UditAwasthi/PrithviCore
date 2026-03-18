'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Leaf, Bug, Lightbulb,
  FileBarChart, Settings, User, ChevronRight,
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
          'group flex items-center gap-3 px-4 py-3.5 rounded-xl mx-4 text-[14px] font-semibold transition-colors duration-200',
          active
            ? 'bg-[#489169] text-white shadow-sm'
            : 'text-white/80 hover:bg-white/10 hover:text-white'
        )}
      >
        <Icon size={18} className={cn('flex-shrink-0', active ? 'text-white' : 'text-white/60 group-hover:text-white')} />
        <span className="flex-1 truncate">{label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-[260px] bg-[#1B5E3F] border-r border-[#1B5E3F]/10 flex-col flex-shrink-0 hidden md:flex z-50">
      {/* Brand Logo Header */}
      <div className="h-24 flex items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border-2 border-white flex items-center justify-center text-white font-bold opacity-90"><Leaf size={18} /></div>
          <span className="text-xl font-bold tracking-tight text-white block">PrithviCore</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />
        ))}
      </div>

      {/* Bottom Profile Card */}
      <div className="p-4 mx-4 mb-6 mt-auto bg-black/20 rounded-xl flex items-center gap-3 hover:bg-black/30 transition-colors cursor-pointer">
         <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-10 h-10 rounded-full object-cover bg-black/20 border border-white/10 shadow-sm" />
         <div className="flex flex-col min-w-0">
            <span className="text-white font-bold text-sm truncate">Alex Johnson</span>
            <span className="text-white/70 text-xs truncate">Pro Member</span>
         </div>
      </div>
    </aside>
  );
}
