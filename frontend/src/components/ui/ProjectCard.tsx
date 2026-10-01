import React from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Image as ImageIcon, ChevronRight, Sparkles } from 'lucide-react';
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
      <div className="liquid-glass rounded-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">
        {/* Card Header Banner */}
        <div className="h-32 w-full bg-gradient-to-br from-white/[0.03] via-[#091020]/30 to-[#00d2ff]/[0.05] relative overflow-hidden flex items-center justify-between p-4 border-b border-white/[0.05]">
          {/* Subtle noise watermark */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00d2ff]/10 via-transparent to-transparent pointer-events-none" />

          {/* Traffic light indicator cues */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <span className="w-2 h-2 rounded-full bg-[#ff5f57]/80" />
            <span className="w-2 h-2 rounded-full bg-[#febc2e]/80" />
            <span className="w-2 h-2 rounded-full bg-[#28c840]/80" />
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-medium px-2.5 py-1 rounded-full border border-white/10 z-10">
            <ImageIcon className="w-3 h-3 text-[#00d2ff]" />
            <span>{displayMediaCount} {displayMediaCount === 1 ? 'asset' : 'assets'}</span>
          </div>

          <div className="mt-5 flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center font-bold text-sm text-white group-hover:scale-105 group-hover:border-[#00d2ff]/50 transition-all duration-300 shadow-inner">
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50 block">
                {(project.project_type || 'Field Project').replace('_', ' ')}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-[#A4F4FD] font-medium mt-0.5">
                <Sparkles className="w-3 h-3 text-[#00d2ff]" />
                <span>AI Ground Truth</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-base font-semibold text-white group-hover:text-[#A4F4FD] transition-colors tracking-tight line-clamp-1">
                {project.name}
              </h4>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
            </div>

            {project.location && (
              <div className="flex items-center gap-1.5 text-xs text-white/50 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-white/40" />
                <span className="truncate">{project.location}</span>
              </div>
            )}

            {project.description ? (
              <p className="text-xs text-white/60 mt-3 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            ) : (
              <p className="text-xs text-white/30 mt-3 italic">
                No description provided.
              </p>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-white/40" />
              <span>
                {startFormatted} – {endFormatted}
              </span>
            </div>
            <span className="text-[11px] text-white/40 group-hover:text-white/80 transition-colors">
              Open &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

