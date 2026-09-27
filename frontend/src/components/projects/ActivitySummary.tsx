'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Activity, Tag } from 'lucide-react';
import { ActivitySummaryItem } from '@/types';

export interface ActivitySummaryProps {
  activities: ActivitySummaryItem[];
}

export const ActivitySummary: React.FC<ActivitySummaryProps> = ({ activities }) => {
  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-primary" />
            <CardTitle className="text-base font-semibold">Activities Breakdown</CardTitle>
          </div>
          <span className="text-xs bg-brand-light-orange text-brand-dark-orange px-2 py-0.5 rounded-full font-semibold">
            {activities.length} {activities.length === 1 ? 'Category' : 'Categories'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-xs text-secondary-text bg-secondary-bg/30 rounded-xl border border-dashed border-border">
            <Tag className="w-6 h-6 text-muted-text mx-auto mb-2 opacity-60" />
            <p className="font-medium text-primary-text">No AI activity data available yet</p>
            <p className="text-muted-text mt-0.5">
              Upload field media to trigger automated AI Vision activity classification.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((item) => (
              <div
                key={item.normalizedKey}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary-bg/40 border border-border/60 hover:border-brand-primary/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                  <span className="text-sm font-semibold text-primary-text">
                    {item.activity}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-secondary-text shadow-2xs">
                  <span className="text-brand-dark-orange font-bold">{item.count}</span>
                  <span>{item.count === 1 ? 'asset' : 'assets'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
