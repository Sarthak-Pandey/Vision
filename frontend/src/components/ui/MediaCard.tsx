import React from 'react';
import { Image as ImageIcon, MapPin, Calendar } from 'lucide-react';
import { Card } from './Card';
import { MediaAsset } from '@/types';

export interface MediaCardProps {
  asset: MediaAsset;
  projectName?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({ asset, projectName }) => {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card hoverable className="p-0 overflow-hidden group">
      <div className="aspect-4/3 w-full bg-secondary-bg relative overflow-hidden flex items-center justify-center">
        <img
          src={asset.url}
          alt={`Media ${asset.id}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // fallback
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white p-1 rounded-md">
          <ImageIcon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="p-3 border-t border-border">
        {projectName && <p className="text-xs font-semibold text-brand-dark-orange truncate">{projectName}</p>}
        <div className="flex items-center justify-between mt-1 text-xs text-secondary-text">
          {asset.capture_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-muted-text" />
              {formatDate(asset.capture_date)}
            </span>
          )}
          {asset.latitude && asset.longitude && (
            <span className="flex items-center gap-0.5 text-muted-text">
              <MapPin className="w-3 h-3" />
              GPS
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
