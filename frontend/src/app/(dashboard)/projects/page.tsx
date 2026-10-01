'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, LayoutGrid, List as ListIcon, FolderKanban, Search, Sparkles, MapPin, Calendar, ImageIcon, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { getProjects } from '@/lib/api/client';
import { Project } from '@/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const totalAssets = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.media_count || 0), 0);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return projects.filter((p) => {
      return (
        p.name.toLowerCase().includes(term) ||
        (p.location && p.location.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    });
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
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              Projects
            </h1>
            <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-[11px] font-mono">
              {projects.length}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1 max-w-lg">
            Manage field impact initiatives, verify ground-truth media, and review audit records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black font-semibold text-xs px-4 py-2 transition-all hover:bg-white/90 active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>New Project</span>
          </Button>
        </div>
      </motion.div>

      {/* Quick Telemetry Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-white/50">Active Workspaces</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-semibold text-white tracking-tight">{projects.length}</span>
            <span className="text-[11px] text-emerald-400 font-medium">Online</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-white/50">Ingested Evidence</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-semibold text-white tracking-tight">{totalAssets}</span>
            <span className="text-[11px] text-white/40 font-mono">Assets</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-white/50">Verification Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-semibold text-white tracking-tight">100%</span>
            <span className="text-[11px] text-sky-300 font-medium">Verified</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-white/50">Engine Version</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-semibold text-white tracking-tight">Vision Core v2.5</span>
          </div>
        </div>
      </motion.div>

      {/* Controls Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 liquid-glass p-2.5 rounded-xl"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects by name, location, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.04] text-white text-xs rounded-lg pl-9 pr-4 py-2 border border-white/[0.08] placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/80'
              }`}
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/80'
              }`}
              aria-label="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Projects List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="liquid-glass rounded-2xl border border-white/10 bg-[#0e1014]/60 h-64 animate-pulse p-4 space-y-4">
              <div className="h-28 bg-white/[0.04] rounded-xl" />
              <div className="h-4 bg-white/[0.06] rounded w-3/4" />
              <div className="h-3 bg-white/[0.04] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="liquid-glass rounded-2xl border border-white/10 bg-[#0e1014]/60 p-12 text-center">
          <EmptyState
            icon={<FolderKanban className="w-8 h-8 text-white/30" />}
            title={searchTerm ? 'No matching projects found' : 'No active projects'}
            description={
              searchTerm
                ? `No projects matched "${searchTerm}". Try a different keyword.`
                : 'Create your first project to start collecting and verifying impact evidence.'
            }
            action={
              <Button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 rounded-full bg-white text-black font-semibold text-xs px-5 py-2.5 hover:bg-white/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>Create First Project</span>
              </Button>
            }
          />
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="liquid-glass rounded-2xl divide-y divide-white/[0.05] overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-3 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between text-xs text-white/50 font-medium">
            <span className="font-semibold text-white/70">Workspace Registry</span>
            <span>Showing {filteredProjects.length} items</span>
          </div>

          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/10 text-white flex items-center justify-center font-semibold text-xs shrink-0 group-hover:border-white/25 transition-colors">
                  {project.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white transition-colors">
                      {project.name}
                    </h3>
                    <span className="text-[10px] font-medium text-white/50 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
                      {(project.project_type || 'Field').replace('_', ' ')}
                    </span>
                  </div>
                  {project.location && (
                    <div className="flex items-center gap-1 text-xs text-white/50 mt-1">
                      <MapPin className="w-3 h-3 text-white/40" />
                      <span>{project.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-white/50">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-white/40" />
                  <span>{project.media_count ?? 0} media</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-white/40" />
                  <span>
                    {project.start_date
                      ? new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : 'Active'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </motion.div>
      )}

      {/* Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={loadProjects}
      />
    </div>
  );
}

