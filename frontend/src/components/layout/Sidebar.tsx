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

const mainNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Media Intelligence', href: '/media', icon: Images },
  { label: 'Evidence Audit', href: '/search', icon: Search },
  { label: 'Impact Reports', href: '/reports', icon: FileText },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] h-full bg-[#070709] border-r border-white/[0.08] flex flex-col justify-between shrink-0 select-none z-30">
      <div>
        {/* Logo / Branding with Alien Head Logo */}
        <Link
          href="/"
          className="p-4 border-b border-white/[0.08] flex items-center justify-between group hover:bg-white/[0.02] transition-colors"
          title="Return to Landing Page"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center p-1.5 group-hover:border-white/25 transition-colors">
              <img
                src="/logo-white.png"
                alt="Vision"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[15px] font-semibold tracking-tight text-white leading-none">
                Vision
              </span>
              <span className="text-[11px] font-mono text-white/40">.ai</span>
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="p-3 space-y-1 mt-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-white/[0.08] text-white border border-white/[0.08] shadow-xs'
                    : 'text-white/55 hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-white/45'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Section: Clean Minimal Workspace Status */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-white/40">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-medium text-white/60">System Ready</span>
          </div>
          <span className="font-mono text-[10px] text-white/30">v2.5</span>
        </div>
      </div>
    </aside>
  );
};

