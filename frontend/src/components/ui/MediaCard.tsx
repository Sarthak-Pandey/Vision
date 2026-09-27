import React from 'react';
import { Image as ImageIcon, Video as VideoIcon, MapPin, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from './Card';
import { MediaAssetWithAnalysis } from '@/types';

export interface MediaCardProps {
  asset: MediaAssetWithAnalysis;
  projectName?: string;
  onClick?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ asset, projectName, onClick }) => {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const confidence = asset.ai_analysis?.confidence
    ? Math.round(asset.ai_analysis.confidence * 100)
    : null;

  return (
    <Card
      hoverable
      onClick={onClick}
      className={`p-0 overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-md ${
        onClick ? 'hover:border-brand-primary/40' : ''
      }`}
    >
      <div className="aspect-4/3 w-full bg-secondary-bg relative overflow-hidden flex items-center justify-center">
        {asset.type === 'video' ? (
          <div className="w-full h-full bg-black/90 flex items-center justify-center relative">
            <video src={asset.url} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center">
                <VideoIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={asset.url}
            alt={`Media ${asset.id}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        )}

        {/* Media Type Icon */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white p-1 rounded-md">
          {asset.type === 'video' ? <VideoIcon className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
        </div>

        {/* AI Analysis Badge */}
        <div className="absolute top-2 left-2">
          {asset.ai_analysis ? (
            asset.ai_analysis.source === 'simulated' ? (
              <span className="bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-amber-500/20">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Simulated Preview
              </span>
            ) : (
              <span className="bg-black/70 backdrop-blur-md text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {confidence}% AI Verified
              </span>
            )
          ) : (
            <span className="bg-black/70 backdrop-blur-md text-muted-text text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Pending AI
            </span>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-border">
        {projectName && <p className="text-xs font-semibold text-brand-dark-orange truncate">{projectName}</p>}
        
        {/* Activity Tag if analyzed */}
        {asset.ai_analysis?.activities && asset.ai_analysis.activities.length > 0 && (
          <p className="text-xs font-medium text-primary-text mt-0.5 truncate capitalize">
            {asset.ai_analysis.activities[0]}
          </p>
        )}

        <div className="flex items-center justify-between mt-1.5 text-xs text-secondary-text">
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
