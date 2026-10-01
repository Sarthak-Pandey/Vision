import React from 'react';
import { Calendar, MapPin, Sparkles, Image as ImageIcon } from 'lucide-react';
import { SearchResult } from '@/types';

interface SearchResultCardProps {
  result: SearchResult;
  projectName?: string;
  onClick?: () => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  projectName,
  onClick,
}) => {
  const similarityScore = result.similarity;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const formattedDate = formatDate(result.capture_date);

  return (
    <div
      onClick={onClick}
      className="liquid-glass rounded-xl overflow-hidden group transition-colors duration-200 flex flex-col cursor-pointer text-left"
    >
      {/* Media Thumbnail Container */}
      <div className="relative aspect-video w-full bg-black/10 dark:bg-black/60 overflow-hidden flex items-center justify-center">
        {result.url ? (
          <img
            src={result.url}
            alt={result.activity || result.description || 'Visual evidence'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-white/30">
            <ImageIcon className="w-8 h-8 opacity-40" />
          </div>
        )}

        {/* Similarity Match Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md bg-black/75 text-[#28c840] border border-[#28c840]/30 shadow-sm">
            <Sparkles className="w-3 h-3 text-[#28c840]" />
            <span>{(similarityScore * 100).toFixed(1)}% match</span>
          </span>
        </div>

        {/* Activity Tag Overlay */}
        {result.activity && (
          <div className="absolute bottom-2.5 left-2.5 max-w-[85%]">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-black/75 text-white/90 backdrop-blur-md border border-white/10 truncate capitalize">
              {result.activity}
            </span>
          </div>
        )}
      </div>

      {/* Card Metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {result.description ? (
            <p className="text-xs text-zinc-900 dark:text-white/80 font-medium line-clamp-2 leading-relaxed">
              {result.description}
            </p>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-white/40 italic">Visual evidence match</p>
          )}
        </div>

        {/* Location & Date Footer */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-white/50 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-1 truncate">
            {result.latitude && result.longitude ? (
              <>
                <MapPin className="w-3 h-3 text-zinc-400 dark:text-white/40 shrink-0" />
                <span className="truncate">
                  {result.latitude.toFixed(3)}, {result.longitude.toFixed(3)}
                </span>
              </>
            ) : (
              <span className="text-zinc-500 dark:text-white/40 truncate">{projectName || 'Project Asset'}</span>
            )}
          </div>

          {formattedDate && (
            <div className="flex items-center gap-1 shrink-0 text-zinc-500 dark:text-white/40">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


