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
  MapPin,
  History,
  ShieldCheck,
  ScanLine,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import PieBurst from '@/components/ui/PieBurst';
import VectorWordmark from '@/components/ui/VectorWordmark';

const mainNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Media Intelligence', href: '/media', icon: Images },
  { label: 'Evidence Audit', href: '/search', icon: Search },
  { label: 'Impact Reports', href: '/reports', icon: FileText },
];

const protocolNavItems = [
  { label: 'Geotagged Proofs', href: '/media', icon: MapPin },
  { label: 'Temporal Baseline', href: '/search', icon: History },
  { label: 'Chain of Custody', href: '/reports', icon: ShieldCheck },
  { label: 'Anomaly Audit', href: '/search', icon: ScanLine },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] h-full bg-[#070709] border-r border-white/[0.08] flex flex-col justify-between shrink-0 select-none z-30">
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Logo / Branding: PieBurst Emblem + VectorWordmark (No .ai) */}
        <Link
          href="/"
          className="h-14 px-3.5 border-b border-white/[0.08] flex items-center gap-2.5 group hover:bg-white/[0.02] transition-colors shrink-0"
          title="Return to Landing Page"
        >
          {/* PieBurst 3D Disc Split Canvas */}
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.1] flex items-center justify-center p-0.5 overflow-hidden shrink-0 group-hover:border-white/30 transition-colors">
            <PieBurst
              background="transparent"
              baseColor="#FFFFFF"
              accentColor="#3D81E3"
              speed={45}
              distance={8}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          {/* VectorWordmark Canvas Typography - NOTE: No .ai */}
          <div className="flex-1 h-7 min-w-0 overflow-hidden relative">
            <VectorWordmark
              text="VISION"
              background="transparent"
              textColor="#FFFFFF"
              shade="#71717A"
              accent="#3D81E3"
              refWidth={140}
              font={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 800,
                fontSize: "18px",
                letterSpacing: "0.08em",
              }}
              handles={{
                size: 16,
                spread: 22,
                labels: false,
              }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </Link>

        {/* Primary Platform Navigation */}
        <div className="p-3 space-y-4">
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              Core Intelligence
            </div>
            <nav className="space-y-0.5">
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

          {/* Verification Protocols Section */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              Verification Protocols
            </div>
            <nav className="space-y-0.5">
              {protocolNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/[0.04] transition-all duration-150"
                  >
                    <Icon className="w-4 h-4 shrink-0 text-white/35" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Dynamic Telemetry Meter */}
        <div className="mt-auto px-3 py-2">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/60 font-medium">Proof Pipeline</span>
              <span className="font-mono text-emerald-400 text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Synchronized
              </span>
            </div>
            <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#3D81E3] h-full rounded-full transition-all duration-500"
                style={{ width: '84%' }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
              <span>Integrity Index</span>
              <span>84% Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Utility Section (NO System Ready badge) */}
      <div className="p-2 border-t border-white/[0.06] space-y-0.5 shrink-0">
        <Link
          href="/search"
          className="flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Telemetry Parameters</span>
          </div>
        </Link>
        <a
          href="https://github.com/Swatantra-66/Vision"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Repository & Audit</span>
          </div>
        </a>
      </div>
    </aside>
  );
};
