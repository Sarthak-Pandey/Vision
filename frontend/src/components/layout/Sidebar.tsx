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
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/auth/AuthContext';

const mainNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Media', href: '/media', icon: Images },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Reports', href: '/reports', icon: FileText },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const userName = user?.name || 'Guest User';

  return (
    <aside className="w-[240px] h-screen sticky top-0 bg-card border-r border-border flex flex-col justify-between shrink-0 select-none z-30 shadow-2xs">
      <div>
        {/* Logo / Branding */}
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-2xs">
            <Logo className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground uppercase leading-none">
              Impact
            </h1>
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase mt-1">
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
                  'relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all group duration-150',
                  isActive
                    ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-3 p-1 rounded-md">
          <Avatar name={userName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{userName}</p>
            <p className="text-[11px] text-muted-foreground truncate">Guest Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
