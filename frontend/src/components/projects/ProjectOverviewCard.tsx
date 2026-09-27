'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { MapPin, Calendar, Clock, Info } from 'lucide-react';
import { Project } from '@/types';

export interface ProjectOverviewCardProps {
  project: Project;
}

export const ProjectOverviewCard: React.FC<ProjectOverviewCardProps> = ({ project }) => {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const formattedStart = formatDate(project.start_date) || 'Start date not specified';
  const formattedEnd = formatDate(project.end_date) || 'End date not specified';
  const formattedCreated = formatDate(project.created_at) || 'Unknown';

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-primary" />
          <CardTitle className="text-base font-semibold">Project Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-secondary-text uppercase tracking-wider">
            Description
          </h4>
          <p className="text-sm text-primary-text leading-relaxed mt-1">
            {project.description?.trim() ||
              'No description specified for this project. Field operations, visual media ingestion, and environmental evidence tracking are active.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/50 text-xs">
          <div>
            <span className="text-secondary-text font-medium flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-muted-text" />
              <span>Location</span>
            </span>
            <span className="font-semibold text-primary-text">
              {project.location?.trim() || 'Location not specified'}
            </span>
          </div>

          <div>
            <span className="text-secondary-text font-medium flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-muted-text" />
              <span>Schedule</span>
            </span>
            <span className="font-semibold text-primary-text">
              {formattedStart} → {formattedEnd}
            </span>
          </div>

          <div>
            <span className="text-secondary-text font-medium flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-text" />
              <span>Created On</span>
            </span>
            <span className="font-semibold text-primary-text">{formattedCreated}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
