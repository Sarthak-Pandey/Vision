'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Calendar, Clock, ChevronDown, ChevronRight, FileQuestion } from 'lucide-react';
import { TimelineYearGroup, MediaAssetWithAnalysis } from '@/types';
import { MediaCard } from '@/components/ui/MediaCard';

export interface ProjectTimelineProps {
  timeline: TimelineYearGroup[];
  undatedCount: number;
  projectName: string;
  onAssetClick?: (asset: MediaAssetWithAnalysis) => void;
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  timeline,
  undatedCount,
  projectName,
  onAssetClick,
}) => {
  // Track open state for expanded month cards
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  if (timeline.length === 0 && undatedCount === 0) {
    return (
      <Card className="border border-border">
        <CardContent className="py-12 text-center">
          <Clock className="w-8 h-8 text-muted-text mx-auto mb-2 opacity-60" />
          <h4 className="text-sm font-semibold text-primary-text">No timeline data available yet</h4>
          <p className="text-xs text-secondary-text mt-1">
            Upload dated media evidence to track chronological project progression over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {undatedCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <FileQuestion className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>{undatedCount}</strong> {undatedCount === 1 ? 'asset has' : 'assets have'} no explicit capture date and {undatedCount === 1 ? 'is' : 'are'} omitted from the chronological timeline.
          </span>
        </div>
      )}

      {timeline.map((yearGroup) => (
        <Card key={yearGroup.year} className="border border-border overflow-hidden">
          <CardHeader className="bg-secondary-bg/50 pb-3 border-b border-border/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-brand-primary" />
                <CardTitle className="text-lg font-bold text-primary-text">
                  {yearGroup.year}
                </CardTitle>
              </div>
              <span className="text-xs font-semibold bg-card border border-border px-2.5 py-1 rounded-lg text-muted-foreground shadow-2xs">
                {yearGroup.totalAssets} {yearGroup.totalAssets === 1 ? 'asset' : 'assets'} total
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {yearGroup.months.map((monthGroup) => {
              const isExpanded = !!expandedMonths[monthGroup.monthKey];
              return (
                <div
                  key={monthGroup.monthKey}
                  className="border border-border rounded-xl bg-card overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleMonth(monthGroup.monthKey)}
                    className="w-full p-3 flex items-center justify-between hover:bg-slate-50 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-brand-light-orange text-brand-dark-orange flex items-center justify-center font-bold text-xs">
                        {monthGroup.monthName.slice(0, 3)}
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-primary-text">
                          {monthGroup.monthName}
                        </h5>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-secondary-text bg-secondary-bg px-2.5 py-0.5 rounded-md">
                        {monthGroup.count} {monthGroup.count === 1 ? 'asset' : 'assets'}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-secondary-text" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-secondary-text" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-slate-50/50 border-t border-border">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {monthGroup.assets.map((asset) => (
                          <MediaCard
                            key={asset.id}
                            asset={asset}
                            projectName={projectName}
                            onClick={() => onAssetClick && onAssetClick(asset)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
