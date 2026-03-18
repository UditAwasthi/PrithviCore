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
          'group flex items-center gap-3 px-4 py-2.5 rounded-xl mx-2 text-sm font-medium transition-all duration-200',
          active
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon size={18} className={cn('flex-shrink-0', active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground')} />
        <span className="flex-1 truncate">{label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-[240px] bg-background/60 backdrop-blur-xl border-r border-border/50 flex flex-col sticky top-[62px] h-[calc(100vh-62px)] overflow-y-auto flex-shrink-0 transition-colors hidden md:flex z-40">
      <div className="flex-1 py-6 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />
        ))}
      </div>

      <div className="py-4 border-t border-border space-y-1">
        {BOTTOM_ITEMS.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />
        ))}
      </div>
    </aside>
  );
}
