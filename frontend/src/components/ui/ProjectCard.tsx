import React from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { Project } from '@/types';

export interface ProjectCardProps {
  project: Project;
  mediaCount?: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, mediaCount }) => {
  const displayMediaCount = mediaCount ?? project.media_count ?? 0;
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Active';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const startFormatted = formatDate(project.start_date);
  const endFormatted = formatDate(project.end_date);

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <div className="liquid-glass rounded-xl transition-all duration-200 flex flex-col h-full overflow-hidden">
        {/* Card Header Banner */}
        <div className="h-28 w-full bg-black/[0.02] dark:bg-white/[0.02] relative flex items-center justify-between p-4 border-b border-black/[0.06] dark:border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/10 flex items-center justify-center font-semibold text-xs text-zinc-900 dark:text-white group-hover:border-blue-500/50 dark:group-hover:border-white/20 transition-colors">
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-white/50 block">
                {(project.project_type || 'Field Project').replace('_', ' ')}
              </span>
              <span className="inline-flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                Active Site
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.04] text-zinc-700 dark:text-white/70 text-[11px] font-medium px-2.5 py-1 rounded-md border border-black/[0.06] dark:border-white/[0.08]">
            <ImageIcon className="w-3 h-3 text-zinc-400 dark:text-white/50" />
            <span>{displayMediaCount} {displayMediaCount === 1 ? 'asset' : 'assets'}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-base font-semibold text-zinc-950 dark:text-white tracking-tight line-clamp-1">
                {project.name}
              </h4>
              <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-white/30 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
            </div>

            {project.location && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-white/50 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-white/40" />
                <span className="truncate">{project.location}</span>
              </div>
            )}

            {project.description ? (
              <p className="text-xs text-zinc-600 dark:text-white/60 mt-3 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-white/30 mt-3 italic">
                No description provided.
              </p>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="pt-4 mt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs text-zinc-500 dark:text-white/50 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-white/40" />
              <span>
                {startFormatted} – {endFormatted}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 dark:text-white/40 group-hover:text-zinc-900 dark:group-hover:text-white/80 transition-colors">
              Open &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

