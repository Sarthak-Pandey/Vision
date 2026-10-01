'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { FileText, ArrowRight, ShieldCheck, Download, Search, Sparkles, MapPin, Calendar, ExternalLink, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { getProjects } from '@/lib/api/client';
import { Project } from '@/types';

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getProjects()
      .then((data) => setProjects(data))
      .catch((err) => console.error('Failed to load projects for reports:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.location && p.location.toLowerCase().includes(term))
    );
  }, [projects, searchTerm]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Impact Reports
            </h1>
            <span className="px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 text-zinc-500 dark:text-white/50 text-[11px] font-mono">
              Audit-Ready
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-white/50 mt-1 max-w-lg">
            Deterministic impact summaries synthesized from verified ground-truth media, automated claims tracking, and spatial evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button className="group inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-black font-semibold text-xs px-4 py-2 transition-all hover:bg-zinc-800 dark:hover:bg-white/90 active:scale-[0.98] shadow-sm cursor-pointer">
              <span>View All Workspaces</span>
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Telemetry Strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-white/50">Reports Ready</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-semibold text-zinc-950 dark:text-white tracking-tight">{projects.length}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Available</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-white/50">Verification Basis</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-semibold text-zinc-950 dark:text-white tracking-tight">Ground-Truth Visuals</span>
            <span className="text-[11px] text-zinc-500 dark:text-white/40 font-mono">Verified</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-white/50">Compliance Standard</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-semibold text-zinc-950 dark:text-white tracking-tight">ESG / ISO-14064</span>
            <span className="text-[11px] text-sky-600 dark:text-sky-300 font-medium">Aligned</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-white/50">Ledger Integrity</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-semibold text-zinc-950 dark:text-white tracking-tight">Cryptographic Checksum</span>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between gap-3 liquid-glass p-2.5 rounded-xl"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 dark:text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter audit reports by project name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/[0.03] dark:bg-white/[0.04] text-zinc-950 dark:text-white text-xs rounded-lg pl-9 pr-4 py-2 border border-black/[0.08] dark:border-white/[0.08] placeholder:text-zinc-400 dark:placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 dark:focus:border-white/30 focus:bg-black/[0.05] dark:focus:bg-white/[0.07] transition-all"
          />
        </div>

        <div className="text-[11px] text-zinc-500 dark:text-white/50 font-medium px-2 hidden sm:block">
          {filteredProjects.length} {filteredProjects.length === 1 ? 'dossier' : 'dossiers'}
        </div>
      </motion.div>

      {/* Reports Catalog */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="liquid-glass rounded-2xl h-56 animate-pulse p-5 space-y-4">
              <div className="h-6 bg-black/[0.06] dark:bg-white/[0.06] rounded w-3/4" />
              <div className="h-4 bg-black/[0.04] dark:bg-white/[0.04] rounded w-1/2" />
              <div className="h-16 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="liquid-glass rounded-2xl p-12 text-center">
          <EmptyState
            icon={<FileText className="w-10 h-10 text-zinc-400 dark:text-white/30" />}
            title="No audit dossiers available"
            description="Reports are generated automatically once projects have ingested media and AI verification."
            action={
              <Link href="/projects">
                <Button className="mt-4 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black font-semibold text-xs px-5 py-2.5 hover:bg-zinc-800 dark:hover:bg-white/90">
                  <span>Create or View Projects</span>
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="liquid-glass rounded-xl p-5 flex flex-col justify-between transition-colors duration-200 group"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.05]">
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-white/50">
                    Impact Dossier
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Verified
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-white tracking-tight line-clamp-1">
                    {project.name}
                  </h3>
                  {project.location && (
                    <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-white/50 mt-1">
                      <MapPin className="w-3 h-3 text-zinc-400 dark:text-white/40" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  )}
                </div>

                {/* Scope Stats Box */}
                <div className="mt-4 p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.04] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-zinc-500 dark:text-white/40 block">Evidence Assets</span>
                    <span className="text-sm font-semibold text-zinc-950 dark:text-white">{project.media_count ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 dark:text-white/40 block">Status</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Ready</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-black/[0.06] dark:border-white/[0.05] flex items-center justify-between gap-2">
                <Link
                  href={`/projects/${project.id}/report`}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-white/60 hover:text-zinc-950 dark:hover:text-white font-medium transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-400 dark:text-white/40" />
                  <span>Inspect Audit</span>
                </Link>

                <Link
                  href={`/projects/${project.id}?tab=report`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-900 dark:text-white bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.12] px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 transition-colors"
                >
                  <span>Open Dossier</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

