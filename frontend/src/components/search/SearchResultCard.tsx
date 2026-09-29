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
  // Format percentage similarity safely
  // Cosine similarity in gemini-embedding-2 typically ranges 0.20 - 0.50+ for positive matches
  // Normalized visual percentage for intuitive UI display
  const similarityScore = result.similarity;
  const matchPercentage = Math.min(Math.round(similarityScore * 100), 100);

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
      className="group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer text-left"
    >
      {/* Media Thumbnail Container */}
      <div className="relative aspect-video w-full bg-secondary-bg overflow-hidden">
        {result.url ? (
          <img
            src={result.url}
            alt={result.activity || result.description || 'Visual evidence'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary-text">
            <ImageIcon className="w-8 h-8 opacity-40" />
          </div>
        )}

        {/* Similarity Match Badge */}
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-md bg-emerald-500/90 text-white border border-emerald-400/30">
            <Sparkles className="w-3 h-3" />
            <span>Similarity {similarityScore.toFixed(2)}</span>
          </span>
        </div>

        {/* Activity Tag Overlay */}
        {result.activity && (
          <div className="absolute bottom-2 left-2 max-w-[85%]">
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-black/60 text-white backdrop-blur-sm truncate">
              {result.activity}
            </span>
          </div>
        )}
      </div>

      {/* Card Metadata */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          {result.description ? (
            <p className="text-xs text-foreground font-medium line-clamp-2 leading-relaxed">
              {result.description}
            </p>
          ) : (
            <p className="text-xs text-secondary-text italic">Visual evidence match</p>
          )}
        </div>

        {/* Location & Date Footer */}
        <div className="flex items-center justify-between text-[11px] text-secondary-text pt-2 border-t border-border/60">
          <div className="flex items-center gap-1 truncate">
            {result.latitude && result.longitude ? (
              <>
                <MapPin className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate">
                  {result.latitude.toFixed(3)}, {result.longitude.toFixed(3)}
                </span>
              </>
            ) : (
              <span className="text-secondary-text/70">{projectName || 'Project Asset'}</span>
            )}
          </div>

          {formattedDate && (
            <div className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3 text-secondary-text" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
