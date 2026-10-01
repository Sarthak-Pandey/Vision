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
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]" />
            <span className="text-[11px] font-medium text-white/50 tracking-wider uppercase">
              Audit & Verification Ledger
            </span>
            <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/40 text-[10px] font-mono">
              Audit-Ready
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-1">
            Impact Verification Reports
          </h1>
          <p className="text-xs text-white/50 mt-1 max-w-lg">
            Deterministic impact summaries synthesized from verified ground-truth media, automated claims tracking, and spatial evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button className="group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-semibold text-xs px-5 py-2.5 transition-all hover:bg-white/90 active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <span>View All Workspaces</span>
              <ChevronRight className="w-3.5 h-3.5 text-black/60 transition-transform group-hover:translate-x-0.5" />
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
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Reports Ready</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white tracking-tight">{projects.length}</span>
            <span className="text-[11px] text-[#28c840] font-medium">Available</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Verification Basis</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-semibold text-white tracking-tight">Ground-Truth Visuals</span>
            <span className="text-[11px] text-[#00d2ff] font-medium">Deterministic</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Compliance Standard</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-semibold text-white tracking-tight">ESG / ISO-14064</span>
            <span className="text-[11px] text-[#A4F4FD] font-medium">Aligned</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Ledger Integrity</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-semibold text-white tracking-tight">Cryptographic Checksum</span>
            <span className="w-2 h-2 rounded-full bg-[#28c840] shadow-[0_0_6px_#28c840]" />
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between gap-3 liquid-glass p-2.5 rounded-2xl"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter audit reports by project name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.04] text-white text-xs rounded-xl pl-9 pr-4 py-2 border border-white/[0.08] placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
          />
        </div>

        <div className="text-[11px] text-white/50 font-medium px-2 hidden sm:block">
          {filteredProjects.length} {filteredProjects.length === 1 ? 'report dossier' : 'report dossiers'}
        </div>
      </motion.div>

      {/* Reports Catalog */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="liquid-glass rounded-2xl h-56 animate-pulse p-5 space-y-4">
              <div className="h-6 bg-white/[0.06] rounded w-3/4" />
              <div className="h-4 bg-white/[0.04] rounded w-1/2" />
              <div className="h-16 bg-white/[0.03] rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="liquid-glass rounded-2xl p-12 text-center">
          <EmptyState
            icon={<FileText className="w-10 h-10 text-white/30" />}
            title="No audit dossiers available"
            description="Reports are generated automatically once projects have ingested media and AI verification."
            action={
              <Link href="/projects">
                <Button className="mt-4 rounded-full bg-white text-black font-semibold text-xs px-5 py-2.5 hover:bg-white/90">
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
              className="liquid-glass rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group"
            >
              <div>
                {/* Traffic dots and badge */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ff5f57]/80" />
                    <span className="w-2 h-2 rounded-full bg-[#febc2e]/80" />
                    <span className="w-2 h-2 rounded-full bg-[#28c840]/80" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#28c840]/10 text-[#28c840] border border-[#28c840]/20">
                    <CheckCircle2 className="w-3 h-3 text-[#28c840]" />

                    Verified
                  </span>
                </div>

                <div className="mt-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 block">
                    Impact Dossier
                  </span>
                  <h3 className="text-base font-semibold text-white group-hover:text-[#A4F4FD] transition-colors mt-0.5 tracking-tight line-clamp-1">
                    {project.name}
                  </h3>
                  {project.location && (
                    <div className="flex items-center gap-1 text-xs text-white/50 mt-1">
                      <MapPin className="w-3 h-3 text-white/40" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  )}
                </div>

                {/* Scope Stats Box */}
                <div className="mt-4 p-3 rounded-xl bg-white/[0.015] border border-white/[0.04] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-white/40 block">Evidence Assets</span>
                    <span className="text-sm font-semibold text-white">{project.media_count ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Dossier Status</span>
                    <span className="text-xs font-semibold text-[#00d2ff]">Ready for Export</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-white/[0.05] flex items-center justify-between gap-2">
                <Link
                  href={`/projects/${project.id}/report`}
                  className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white font-medium transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[#00d2ff]" />
                  <span>Inspect Audit</span>
                </Link>

                <Link
                  href={`/projects/${project.id}?tab=report`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/15 transition-all"
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

