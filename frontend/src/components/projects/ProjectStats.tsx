'use client';

import React from 'react';
import { Images, Activity, MapPin } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ProjectStatsSummary } from '@/types';

export interface ProjectStatsProps {
  stats: ProjectStatsSummary;
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="MEDIA"
        value={stats.mediaCount}
        icon={<Images className="w-5 h-5 text-brand-primary" />}
      />
      <StatCard
        title="ACTIVITIES"
        value={stats.activityCount}
        icon={<Activity className="w-5 h-5 text-brand-primary" />}
      />
      <StatCard
        title="LOCATIONS"
        value={stats.locationCount}
        icon={<MapPin className="w-5 h-5 text-brand-primary" />}
      />
    </div>
  );
};
