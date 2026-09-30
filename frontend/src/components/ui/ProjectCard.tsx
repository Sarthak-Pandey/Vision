import React from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import { Card } from './Card';
import { Project } from '@/types';

export interface ProjectCardProps {
  project: Project;
  mediaCount?: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, mediaCount }) => {
  const displayMediaCount = mediaCount ?? project.media_count ?? 0;
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
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
      <Card hoverable className="h-full flex flex-col overflow-hidden p-0 border border-border bg-card text-card-foreground shadow-2xs hover:shadow-md transition-all duration-200">
        {/* Top Image Preview / Cover */}
        <div className="h-32 w-full bg-gradient-to-br from-orange-50/80 via-amber-50/30 to-orange-100/40 dark:from-neutral-900 dark:via-neutral-850 dark:to-neutral-900 relative overflow-hidden flex items-center justify-center border-b border-border">
          <div className="flex flex-col items-center justify-center gap-1.5 text-brand-dark-orange">
            <div className="w-11 h-11 rounded-lg bg-background shadow-2xs border border-border flex items-center justify-center font-bold text-sm text-foreground group-hover:scale-105 transition-transform duration-300">
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground capitalize tracking-wider">
              {(project.project_type || 'Project').replace('_', ' ')}
            </span>
          </div>
          <div className="absolute bottom-2 left-3 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md border border-white/10">
            <ImageIcon className="w-3 h-3 text-brand-orange" />
            <span>{displayMediaCount} media</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-foreground group-hover:text-brand-dark-orange transition-colors tracking-tight">
              {project.name}
            </h4>
            {project.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
                <span>{project.location}</span>
              </div>
            )}
            {project.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {startFormatted} – {endFormatted}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
