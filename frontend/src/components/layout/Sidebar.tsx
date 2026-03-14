'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Leaf, Bug, Lightbulb,
  FileBarChart, Settings, User, ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

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
        className={clsx(
          'group flex items-center gap-3 px-4 py-2.5 rounded-xl mx-2 text-sm font-medium transition-all duration-150',
          active
            ? 'bg-agri-50 text-agri-700 font-semibold border-l-[3px] border-agri-600 pl-[13px]'
            : 'text-gray-500 hover:bg-agri-50/60 hover:text-agri-700 border-l-[3px] border-transparent'
        )}
      >
        <Icon size={17} className={clsx('flex-shrink-0', active ? 'text-agri-600' : 'text-gray-400 group-hover:text-agri-500')} />
        <span className="flex-1 truncate">{label}</span>
        {active && <ChevronRight size={14} className="text-agri-400" />}
      </Link>
    );
  };

  return (
    <aside className="w-[215px] bg-white border-r border-agri-100 flex flex-col sticky top-[62px] h-[calc(100vh-62px)] overflow-y-auto flex-shrink-0">
      <div className="flex-1 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />
        ))}
      </div>

      <div className="py-4 border-t border-agri-100 space-y-0.5">
        {BOTTOM_ITEMS.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />
        ))}
      </div>
    </aside>
  );
}
