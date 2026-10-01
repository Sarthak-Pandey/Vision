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
      className="liquid-glass rounded-2xl overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      <div className="aspect-4/3 w-full bg-black/60 relative overflow-hidden flex items-center justify-center">
        {asset.type === 'video' ? (
          <div className="w-full h-full bg-black/90 flex items-center justify-center relative">
            <video src={asset.url} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                <VideoIcon className="w-4 h-4 text-[#00d2ff]" />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={asset.url}
            alt={`Evidence ${asset.id}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        )}

        {/* Media Type Pill */}
        <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md text-white/80 p-1.5 rounded-lg border border-white/10 shadow-sm">
          {asset.type === 'video' ? <VideoIcon className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
        </div>

        {/* AI Analysis Status Pill */}
        <div className="absolute top-2.5 left-2.5">
          {asset.ai_analysis ? (
            asset.ai_analysis.source === 'simulated' ? (
              <span className="bg-black/75 backdrop-blur-md text-[#A4F4FD] text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-[#00d2ff]/30 shadow-sm">
                <Sparkles className="w-3 h-3 text-[#00d2ff]" />
                Simulated
              </span>
            ) : (
              <span className="bg-black/75 backdrop-blur-md text-[#28c840] text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-[#28c840]/30 shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-[#28c840]" />
                {confidence}% Verified
              </span>
            )
          ) : (
            <span className="bg-black/75 backdrop-blur-md text-white/50 text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10 shadow-sm">
              <Sparkles className="w-3 h-3 text-white/40" />
              Pending
            </span>
          )}
        </div>
      </div>

      <div className="p-3.5 border-t border-white/[0.05] flex-1 flex flex-col justify-between">
        <div>
          {projectName && (
            <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider truncate">
              {projectName}
            </p>
          )}

          {/* Activity Tag if analyzed */}
          {asset.ai_analysis?.activities && asset.ai_analysis.activities.length > 0 ? (
            <p className="text-sm font-medium text-white group-hover:text-[#A4F4FD] transition-colors mt-0.5 truncate capitalize">
              {asset.ai_analysis.activities[0]}
            </p>
          ) : (
            <p className="text-xs text-white/40 mt-0.5 truncate">
              Field evidence asset
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.04] text-[11px] text-white/50 font-medium">
          {asset.capture_date ? (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-white/40" />
              {formatDate(asset.capture_date)}
            </span>
          ) : (
            <span className="text-white/30">No date</span>
          )}
          {asset.latitude && asset.longitude && (
            <span className="flex items-center gap-1 text-white/60 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/10 text-[10px]">
              <MapPin className="w-2.5 h-2.5 text-[#00d2ff]" />
              GPS
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

