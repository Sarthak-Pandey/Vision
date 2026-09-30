'use client';

import React, { useEffect, useState } from 'react';
import { Plus, LayoutGrid, List as ListIcon, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { getProjects } from '@/lib/api/client';
import { Project } from '@/types';
import Link from 'next/link';

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

  const filteredProjects = projects.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.location && p.location.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight">Projects</h1>
          <p className="text-sm text-secondary-text mt-0.5">
            Manage and organize your impact projects.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-2xs">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search projects by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-8 h-8 text-muted-text" />}
          title={searchTerm ? 'No matching projects' : 'No projects yet'}
          description={
            searchTerm
              ? `No projects matched "${searchTerm}". Try a different keyword.`
              : 'Create your first project to start collecting impact evidence.'
          }
          action={
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden shadow-2xs">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary-bg/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-light-orange text-brand-dark-orange flex items-center justify-center font-bold text-sm shrink-0">
                  {project.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-primary-text">{project.name}</h3>
                  <p className="text-xs text-secondary-text">{project.location || 'Location unspecified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs text-secondary-text">
                <span>{project.media_count ?? 0} media</span>
                <span>{project.start_date || 'N/A'} – {project.end_date || 'N/A'}</span>
              </div>
            </Link>
          ))}
        </div>
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
