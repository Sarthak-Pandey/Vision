'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  FolderKanban,
  Images,
  Activity,
  ShieldCheck,
  MapPin,
  Upload,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { getProjects, getAssets } from '@/lib/api/client';
import { Project, MediaAssetWithAnalysis } from '@/types';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<MediaAssetWithAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'verified' | 'pending'>('all');

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [projData, assetData] = await Promise.all([
        getProjects().catch(() => []),
        getAssets().catch(() => []),
      ]);
      setProjects(projData);
      setAssets(assetData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute distinct activities from AI analysis
  const distinctActivities = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => {
      (a.ai_analysis?.activities || []).forEach((act) => set.add(act));
    });
    return Array.from(set);
  }, [assets]);

  // Compute verified evidence count
  const evidenceCount = useMemo(() => {
    return assets.filter((a) => !!a.ai_analysis).length;
  }, [assets]);

  // Compute activity distribution dynamically
  const activityDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    assets.forEach((a) => {
      (a.ai_analysis?.activities || []).forEach((act) => {
        counts.set(act, (counts.get(act) || 0) + 1);
      });
    });
    const total = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
  }, [assets]);

  const recentMedia = assets.slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header Row with macOS-inspired Action Pills */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.06] dark:border-white/[0.06]"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-950 dark:text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-zinc-500 dark:text-white/50 mt-1 leading-relaxed">
            Multi-project photographic provenance, observable change tracking, and heuristic confidence telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/media"
            className="group inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-zinc-700 dark:text-white/80 hover:text-zinc-950 dark:hover:text-white text-xs font-medium px-3.5 py-2 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-500 dark:text-white/60 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors" />
            <span>Upload Media</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-black font-semibold text-xs px-3.5 py-2 transition-all hover:bg-zinc-800 dark:hover:bg-white/90 active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </motion.div>

      {/* 4 Telemetry Cards */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Projects */}
        <div className="liquid-glass rounded-xl p-5 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-white/50">Active Projects</span>
            <div className="w-7 h-7 rounded-md bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-zinc-600 dark:text-white/60 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {projects.length}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                Online
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-white/40 mt-1.5 truncate">
              {projects.length === 1 ? '1 active operational site' : `${projects.length} operational sites`}
            </p>
          </div>
        </div>

        {/* Card 2: Assets */}
        <div className="liquid-glass rounded-xl p-5 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-white/50">Ingested Assets</span>
            <div className="w-7 h-7 rounded-md bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-zinc-600 dark:text-white/60 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
              <Images className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {assets.length}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-white/40 font-mono">
                {assets.length} files
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-white/40 mt-1.5 truncate">
              Geotagged photos & field video
            </p>
          </div>
        </div>

        {/* Card 3: Activity Classes */}
        <div className="liquid-glass rounded-xl p-5 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-white/50">Activity Classes</span>
            <div className="w-7 h-7 rounded-md bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-zinc-600 dark:text-white/60 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {distinctActivities.length}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-sky-600 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                Indexed
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-white/40 mt-1.5 truncate">
              Physical intervention categories
            </p>
          </div>
        </div>

        {/* Card 4: Verified Evidence */}
        <div className="liquid-glass rounded-xl p-5 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-white/50">Verified Evidence</span>
            <div className="w-7 h-7 rounded-md bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-zinc-600 dark:text-white/60 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {evidenceCount}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                {assets.length > 0 ? `${Math.round((evidenceCount / assets.length) * 100)}%` : '0%'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-white/40 mt-1.5 truncate">
              Multimodal verification proofs
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Console */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="liquid-glass rounded-xl overflow-hidden"
      >
        {/* Console Header Bar */}
        <div className="h-11 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.05] px-5 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-zinc-800 dark:text-white/80">
              Operational Status & Activity Registry
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Chips */}
            <div className="hidden sm:flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.04] p-0.5 rounded-lg border border-black/[0.06] dark:border-white/[0.06]">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-white dark:bg-white/10 text-zinc-950 dark:text-white shadow-2xs'
                    : 'text-zinc-500 dark:text-white/40 hover:text-zinc-950 dark:hover:text-white'
                }`}
              >
                All Projects
              </button>
              <button
                onClick={() => setSelectedFilter('verified')}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedFilter === 'verified'
                    ? 'bg-white dark:bg-white/10 text-zinc-950 dark:text-white shadow-2xs'
                    : 'text-zinc-500 dark:text-white/40 hover:text-zinc-950 dark:hover:text-white'
                }`}
              >
                Verified
              </button>
            </div>
            <Link
              href="/projects"
              className="text-[11px] text-zinc-500 dark:text-white/50 hover:text-zinc-950 dark:hover:text-white flex items-center gap-1 transition-colors pl-2"
            >
              <span>View all</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>


        {/* Console Body: 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
          {/* Left Column: Project Rows (7 cols) */}
          <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-black/[0.06] dark:border-white/[0.05] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-semibold text-zinc-600 dark:text-white/70 uppercase tracking-wider">
                  Active Field Registries
                </span>
                <span className="text-xs text-zinc-400 dark:text-white/40 font-mono">
                  {projects.length} project{projects.length === 1 ? '' : 's'}
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-3 py-4">
                  <div className="h-14 bg-black/[0.02] dark:bg-white/[0.02] animate-pulse rounded-xl" />
                  <div className="h-14 bg-black/[0.02] dark:bg-white/[0.02] animate-pulse rounded-xl" />
                </div>
              ) : projects.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-black/[0.04] dark:bg-white/[0.04] text-zinc-400 dark:text-white/30 flex items-center justify-center mx-auto">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-white/80">No active field projects</p>
                    <p className="text-xs text-zinc-500 dark:text-white/40 mt-1 max-w-sm mx-auto leading-relaxed">
                      Register your first operational project to bind geotagged photos, videos, and multi-temporal evidence.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black font-semibold text-xs px-4 py-2 hover:bg-zinc-800 dark:hover:bg-white/90 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Project</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {projects.slice(0, 5).map((proj) => (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.id}`}
                      className="group flex items-center justify-between p-3.5 rounded-lg border border-black/[0.06] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] hover:border-black/[0.12] dark:hover:border-white/[0.1] transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-md bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-zinc-900 dark:text-white flex items-center justify-center text-xs font-semibold shrink-0 group-hover:border-blue-500/50 dark:group-hover:border-white/20 transition-colors">
                          {proj.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-zinc-950 dark:text-white truncate transition-colors">
                              {proj.name}
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-white/40 flex items-center gap-1.5 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-zinc-400 dark:text-white/30" />
                            <span>{proj.location || 'Site Coordinates Logged'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-white/70 font-mono">
                          {proj.media_count || 0} assets
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-white/30 group-hover:text-zinc-950 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Status Ticker */}
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.06] mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-white/40">
              <div className="flex items-center gap-2">
                <span>Deterministic Heuristic Engine Active</span>
              </div>
              <span>v1.0.0</span>
            </div>
          </div>

          {/* Right Column: Activity Telemetry Breakdown (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-black/[0.02] dark:bg-black/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-semibold text-zinc-600 dark:text-white/70 uppercase tracking-wider">
                  Activity Taxonomy
                </span>
                <span className="text-xs text-zinc-400 dark:text-white/40">
                  {distinctActivities.length} classes
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-3 py-4">
                  <div className="h-8 bg-black/[0.02] dark:bg-white/[0.02] animate-pulse rounded" />
                  <div className="h-8 bg-black/[0.02] dark:bg-white/[0.02] animate-pulse rounded" />
                </div>
              ) : activityDistribution.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-9 h-9 rounded-full bg-black/[0.04] dark:bg-white/[0.04] text-zinc-400 dark:text-white/30 flex items-center justify-center mx-auto">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-800 dark:text-white/80">No activity distribution yet</p>
                    <p className="text-[11px] text-zinc-500 dark:text-white/40 mt-1 max-w-[240px] mx-auto leading-relaxed">
                      Upload geotagged field media to automatically classify operational tasks and evidence claims.
                    </p>
                  </div>
                  <Link
                    href="/media"
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-white/70 hover:text-zinc-950 dark:hover:text-white pt-1 transition-colors"
                  >
                    <span>Ingest Media</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 mt-2">
                  {activityDistribution.map((item, idx) => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-800 dark:text-white/80 capitalize font-medium">{item.name}</span>
                        <span className="text-zinc-500 dark:text-white/40 font-mono text-[11px]">
                          {item.count} ({item.percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/[0.06] dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-blue-600 dark:bg-white/60"
                          style={{
                            width: `${Math.max(item.percent, 8)}%`,
                            opacity: idx === 0 ? 1 : idx === 1 ? 0.8 : idx === 2 ? 0.6 : 0.4,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Shortcuts */}
            <div className="pt-5 border-t border-black/[0.06] dark:border-white/[0.06] mt-6 space-y-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-white/50 block">
                Quick Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/search"
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.05] dark:bg-white/[0.02] dark:hover:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] text-xs text-zinc-700 hover:text-zinc-950 dark:text-white/80 dark:hover:text-white transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-zinc-500 dark:text-white/50" />
                  <span>Evidence Search</span>
                </Link>
                <Link
                  href="/reports"
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.05] dark:bg-white/[0.02] dark:hover:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] text-xs text-zinc-700 hover:text-zinc-950 dark:text-white/80 dark:hover:text-white transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Impact Reports</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Visual Evidence Ledger */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="liquid-glass rounded-xl p-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.05]">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white tracking-tight">
              Recent Evidence Ledger
            </h2>
            <p className="text-xs text-zinc-500 dark:text-white/40 mt-0.5">
              Verified ground-truth photographic captures with GPS metadata
            </p>
          </div>
          <Link
            href="/media"
            className="text-xs text-zinc-600 dark:text-white/60 hover:text-zinc-950 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Explore all media</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="mt-5">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-square bg-black/[0.02] dark:bg-white/[0.02] animate-pulse rounded-xl" />
              ))}
            </div>
          ) : recentMedia.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-black/[0.04] dark:bg-white/[0.04] text-zinc-400 dark:text-white/30 flex items-center justify-center mx-auto">
                <Images className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-white/80">No visual evidence records</p>
                <p className="text-xs text-zinc-500 dark:text-white/40 mt-1 max-w-sm mx-auto leading-relaxed">
                  Ingest field media to automatically extract activities, detect observable changes, and compute confidence scores.
                </p>
              </div>
              <Link
                href="/media"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-zinc-900 dark:text-white text-xs font-medium px-4 py-2 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Field Media</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {recentMedia.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02] overflow-hidden hover:border-black/[0.2] dark:hover:border-white/[0.22] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all"
                >
                  <div className="aspect-square relative overflow-hidden bg-black/10 dark:bg-black/50">
                    <img
                      src={item.url}
                      alt={item.ai_analysis?.scene || 'Field observation'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.ai_analysis?.activities?.[0] && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] text-white font-medium border border-white/10">
                        {item.ai_analysis.activities[0]}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-zinc-900 dark:text-white/90 truncate">
                      {item.ai_analysis?.scene || 'Observation Recorded'}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-white/40 mt-1 flex items-center justify-between">
                      <span>
                        {item.capture_date
                          ? new Date(item.capture_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Undated'}
                      </span>
                      {item.latitude && (
                        <span className="text-[10px] text-zinc-600 dark:text-white/60 bg-black/[0.05] dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-black/[0.08] dark:border-white/10 font-mono">GPS</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchDashboardData}
      />
    </div>
  );
}
