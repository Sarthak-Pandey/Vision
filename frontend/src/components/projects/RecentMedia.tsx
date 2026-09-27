'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Images, ArrowRight } from 'lucide-react';
import { MediaAssetWithAnalysis } from '@/types';
import { MediaCard } from '@/components/ui/MediaCard';

export interface RecentMediaProps {
  assets: MediaAssetWithAnalysis[];
  projectName: string;
  onViewAllClick?: () => void;
  onAssetClick?: (asset: MediaAssetWithAnalysis) => void;
  onUploadClick?: () => void;
}

export const RecentMedia: React.FC<RecentMediaProps> = ({
  assets,
  projectName,
  onViewAllClick,
  onAssetClick,
  onUploadClick,
}) => {
  const recentItems = assets.slice(0, 4);

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Images className="w-4 h-4 text-brand-primary" />
            <CardTitle className="text-base font-semibold">Recent Media Evidence</CardTitle>
          </div>
          {assets.length > 0 && onViewAllClick && (
            <button
              type="button"
              onClick={onViewAllClick}
              className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1"
            >
              <span>View all ({assets.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {recentItems.length === 0 ? (
          <div className="p-8 text-center bg-secondary-bg/30 border border-border border-dashed rounded-xl">
            <Images className="w-8 h-8 text-muted-text mx-auto mb-2 opacity-60" />
            <p className="text-xs font-medium text-primary-text">No media uploaded yet.</p>
            <p className="text-xs text-secondary-text mt-0.5">
              Upload your first image or video to start building project intelligence.
            </p>
            {onUploadClick && (
              <button
                type="button"
                onClick={onUploadClick}
                className="mt-3 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-brand-primary/90 transition-colors shadow-2xs"
              >
                Upload Media
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentItems.map((asset) => (
              <MediaCard
                key={asset.id}
                asset={asset}
                projectName={projectName}
                onClick={() => onAssetClick && onAssetClick(asset)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
