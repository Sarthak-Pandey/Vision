import React from 'react';
import { Image as ImageIcon, Video as VideoIcon, MapPin, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
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
    <div
      onClick={onClick}
      className="liquid-glass rounded-xl overflow-hidden group cursor-pointer transition-colors duration-200 flex flex-col"
    >
      <div className="aspect-4/3 w-full bg-black/60 relative overflow-hidden flex items-center justify-center">
        {asset.type === 'video' ? (
          <div className="w-full h-full bg-black/90 flex items-center justify-center relative">
            <video src={asset.url} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-black/80 text-white flex items-center justify-center border border-white/20">
                <VideoIcon className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={asset.url}
            alt={`Evidence ${asset.id}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        )}

        {/* Media Type Pill */}
        <div className="absolute top-2.5 right-2.5 bg-black/80 text-white/80 p-1.5 rounded-md border border-white/10">
          {asset.type === 'video' ? <VideoIcon className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
        </div>

        {/* AI Analysis Status Pill */}
        <div className="absolute top-2.5 left-2.5">
          {asset.ai_analysis ? (
            asset.ai_analysis.source === 'simulated' ? (
              <span className="bg-black/80 text-sky-300 text-[10px] font-medium px-2 py-0.5 rounded border border-sky-400/20">
                Simulated
              </span>
            ) : (
              <span className="bg-black/80 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-400/20">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {confidence}% Verified
              </span>
            )
          ) : (
            <span className="bg-black/80 text-white/50 text-[10px] font-medium px-2 py-0.5 rounded border border-white/10">
              Pending
            </span>
          )}
        </div>
      </div>

      <div className="p-3.5 border-t border-black/[0.06] dark:border-white/[0.05] flex-1 flex flex-col justify-between">
        <div>
          {projectName && (
            <p className="text-[11px] font-medium text-zinc-500 dark:text-white/50 truncate">
              {projectName}
            </p>
          )}

          {/* Activity Tag if analyzed */}
          {asset.ai_analysis?.activities && asset.ai_analysis.activities.length > 0 ? (
            <p className="text-xs font-medium text-zinc-950 dark:text-white mt-0.5 truncate capitalize">
              {asset.ai_analysis.activities[0]}
            </p>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-white/40 mt-0.5 truncate">
              Field evidence asset
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.04] text-[11px] text-zinc-500 dark:text-white/50 font-medium">
          {asset.capture_date ? (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-400 dark:text-white/40" />
              {formatDate(asset.capture_date)}
            </span>
          ) : (
            <span className="text-zinc-400 dark:text-white/30">No date</span>
          )}
          {asset.latitude && asset.longitude && (
            <span className="flex items-center gap-1 text-zinc-600 dark:text-white/60 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-black/[0.08] dark:border-white/10 text-[10px]">
              <MapPin className="w-2.5 h-2.5 text-zinc-400 dark:text-white/40" />
              GPS
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

