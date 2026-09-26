'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Images,
  Search,
  FileText,
  Settings,
  CircleHelp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/ui/Avatar';

const mainNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Media', href: '/media', icon: Images },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Reports', href: '/reports', icon: FileText },
];

const secondaryNavItems = [
  { label: 'Settings', href: '#', icon: Settings },
  { label: 'Help & Support', href: '#', icon: CircleHelp },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] h-screen sticky top-0 bg-white border-r border-border flex flex-col justify-between shrink-0 select-none z-30">
      <div>
        {/* Logo / Branding */}
        <div className="p-6 border-b border-border flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center text-white font-bold text-sm shadow-xs">
            ◉
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-primary-text uppercase leading-none">
              Impact
            </h1>
            <p className="text-[10px] font-semibold text-brand-dark-orange tracking-widest uppercase mt-0.5">
              Intelligence
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 mt-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-brand-light-orange text-brand-dark-orange font-semibold'
                    : 'text-secondary-text hover:text-primary-text hover:bg-secondary-bg'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-orange rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-brand-dark-orange' : 'text-secondary-text group-hover:text-primary-text'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 my-2">
          <div className="h-px bg-border w-full" />
        </div>

        <div className="p-3 space-y-1">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-secondary-text hover:text-primary-text hover:bg-secondary-bg transition-colors"
              >
                <Icon className="w-4 h-4 text-secondary-text" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border bg-white">
        <div className="flex items-center gap-3">
          <Avatar name="Sarthak Pandey" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary-text truncate">Sarthak Pandey</p>
            <p className="text-[11px] text-secondary-text truncate">Team Member</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
