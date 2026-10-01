'use client';
import React, { useEffect, useState } from 'react';
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
import CrystalGlow from '@/components/ui/CrystalGlow';
import { getProjects, getAssets } from '@/lib/api/client';

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
  const [projectCount, setProjectCount] = useState<number>(0);
  const [assetCount, setAssetCount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const [projects, assets] = await Promise.all([
          getProjects().catch(() => []),
          getAssets().catch(() => []),
        ]);
        if (isMounted) {
          setProjectCount(projects.length);
          setAssetCount(assets.length);
          setIsLoaded(true);
        }
      } catch (err) {
        if (isMounted) setIsLoaded(true);
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <aside className="w-[240px] h-full bg-[#070709] border-r border-white/[0.08] flex flex-col justify-between shrink-0 select-none z-30">
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Logo / Branding: Borderless Big PieBurst Emblem + CrystalGlow VISION */}
        <Link
          href="/"
          className="h-14 px-4 border-b border-white/[0.08] flex items-center gap-3 group hover:bg-white/[0.02] transition-colors shrink-0"
          title="Return to Landing Page"
        >
          {/* PieBurst 3D Disc Split — Round, Perfectly Unclipped, Floating */}
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <PieBurst
              background="transparent"
              baseColor="#FFFFFF"
              accentColor="#3D81E3"
              speed={45}
              distance={5.8}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          {/* CrystalGlow Interactive Typography — VISION */}
          <div className="flex-1 h-8 min-w-0 flex items-center">
            <CrystalGlow
              text="VISION"
              fontSize={19}
              fontWeight={800}
              letterSpacing="0.06em"
              textColor="#FFFFFF"
              shadowColor="rgba(61, 129, 227, 0.75)"
              glareColor="rgba(255, 255, 255, 0.95)"
              glareSpeed={1.2}
              padding="0px"
              style={{ justifyContent: 'flex-start', width: 'auto' }}
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

        {/* Workspace Registry Metrics — Real Database Data */}
        <div className="mt-auto px-3 py-2.5">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="font-medium">Active Registry</span>
              <span className="font-mono text-white/40 text-[10px]">
                {isLoaded ? `${projectCount} ${projectCount === 1 ? 'Project' : 'Projects'}` : 'Syncing...'}
              </span>
            </div>
            <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
              <div
                className="bg-white/40 h-full rounded-full transition-all duration-500"
                style={{
                  width: isLoaded && (projectCount > 0 || assetCount > 0)
                    ? `${Math.min(100, Math.max(12, ((assetCount + projectCount) / 25) * 100))}%`
                    : '0%',
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/40">
              <span>Ingested Evidence</span>
              <span className="font-mono text-white/60">
                {isLoaded ? `${assetCount} ${assetCount === 1 ? 'Asset' : 'Assets'}` : '0 Assets'}
              </span>
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
