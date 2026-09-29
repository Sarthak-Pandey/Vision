import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  Database,
  ArrowRight,
  Filter,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { SearchResult, IndexingStats, MediaAssetWithAnalysis } from '@/types';
import { semanticSearch, getIndexingStats, triggerIndexing, getAssetAnalysis } from '@/lib/api/client';
import { SearchResultCard } from './SearchResultCard';
import { Button } from '@/components/ui/Button';

interface SemanticSearchSectionProps {
  projectId: string;
  projectName: string;
  onAssetSelect: (asset: MediaAssetWithAnalysis) => void;
}

const SAMPLE_QUERIES = [
  'workers planting trees',
  'river restoration and riparian buffer',
  'clean energy and solar panels',
  'terminal logs on computer screen',
];

export const SemanticSearchSection: React.FC<SemanticSearchSectionProps> = ({
  projectId,
  projectName,
  onAssetSelect,
}) => {
  const [query, setQuery] = useState('');
  const [activeSearchedQuery, setActiveSearchedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [stats, setStats] = useState<IndexingStats | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingMsg, setIndexingMsg] = useState<string | null>(null);

  // Load indexing stats for this project
  const loadStats = async () => {
    try {
      const s = await getIndexingStats(projectId);
      setStats(s);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadStats();
  }, [projectId]);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = (customQuery !== undefined ? customQuery : query).trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);
    setActiveSearchedQuery(q);

    try {
      const data = await semanticSearch({
        projectId,
        query: q,
        threshold: 0.20,
        limit: 12,
      });
      setResults(data.results);
      setHasSearched(true);
    } catch (err: any) {
      console.error('Semantic search failed:', err);
      setError('Search is temporarily unavailable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerIndex = async () => {
    setIsIndexing(true);
    setIndexingMsg('Indexing unindexed media with multimodal vision embeddings...');
    try {
      const res = await triggerIndexing(projectId);
      await loadStats();
      setIndexingMsg(
        res.processed > 0
          ? `Successfully indexed ${res.successful} image(s)!`
          : 'All images in this project are already indexed.'
      );
      setTimeout(() => setIndexingMsg(null), 4000);
    } catch (err: any) {
      setIndexingMsg('Indexing failed. Please verify API key.');
      setTimeout(() => setIndexingMsg(null), 4000);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleCardClick = async (res: SearchResult) => {
    let realAnalysis = null;
    try {
      realAnalysis = await getAssetAnalysis(res.asset_id);
    } catch {
      realAnalysis = null;
    }

    onAssetSelect({
      id: res.asset_id,
      project_id: res.project_id,
      url: res.url,
      type: res.type,
      capture_date: res.capture_date,
      latitude: res.latitude,
      longitude: res.longitude,
      created_at: res.capture_date || new Date().toISOString(),
      ai_analysis: realAnalysis,
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Multimodal AI Semantic Search (Phase 4)</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Search Visual Evidence in Natural Language
          </h2>

          <p className="text-xs md:text-sm text-secondary-text leading-relaxed">
            Search physical ground-truth photos for <span className="font-semibold text-foreground">{projectName}</span> directly by meaning—even if images have no filenames or manually assigned tags.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="pt-2">
            <div className="relative flex items-center shadow-md rounded-xl bg-background border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-5 h-5 text-secondary-text ml-4 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try "workers planting trees" or "river restoration"...'
                className="w-full bg-transparent px-3.5 py-3.5 text-sm text-foreground placeholder:text-secondary-text/60 focus:outline-none"
              />
              <div className="pr-2">
                <Button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="gap-2 px-5 py-2 text-xs font-semibold rounded-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span>Search</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Prompt Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-secondary-text">
            <span className="font-medium text-secondary-text/80">Try:</span>
            {SAMPLE_QUERIES.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  handleSearch(undefined, sample);
                }}
                className="px-2.5 py-1 rounded-full bg-secondary-bg hover:bg-primary/10 hover:text-primary border border-border/60 transition-colors text-left"
              >
                &ldquo;{sample}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Indexing Stats Badge */}
        {stats && (
          <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-secondary-text">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary shrink-0" />
              <span>
                Index Status:{' '}
                <strong className="text-foreground font-semibold">
                  {stats.indexed} / {stats.total}
                </strong>{' '}
                Images Indexed in pgvector
              </span>
              {stats.pending > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                  {stats.pending} pending
                </span>
              )}
            </div>

            {stats.pending > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerIndex}
                disabled={isIndexing}
                className="gap-1.5 h-8 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isIndexing ? 'animate-spin' : ''}`} />
                <span>{isIndexing ? 'Indexing...' : 'Index Pending Images'}</span>
              </Button>
            )}

            {indexingMsg && (
              <span className="text-primary font-medium text-xs">{indexingMsg}</span>
            )}
          </div>
        )}
      </div>

      {/* Search Results Area */}
      <div className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Searching media with multimodal embeddings...</p>
            <p className="text-xs text-secondary-text">Comparing vector similarity in pgvector</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Results Header */}
        {!isLoading && !error && hasSearched && (
          <div className="flex items-center justify-between text-sm text-secondary-text px-1">
            <p>
              Found <strong className="text-foreground">{results.length}</strong> relevant visual match
              {results.length === 1 ? '' : 'es'} for &ldquo;
              <span className="text-foreground font-medium">{activeSearchedQuery}</span>&rdquo;
            </p>
            <span className="text-xs font-mono bg-secondary-bg px-2.5 py-1 rounded border border-border">
              pgvector &bull; cosine metric
            </span>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && !error && hasSearched && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-300">
            {results.map((res) => (
              <SearchResultCard
                key={res.asset_id}
                result={res}
                projectName={projectName}
                onClick={() => handleCardClick(res)}
              />
            ))}
          </div>
        )}

        {/* No Results State */}
        {!isLoading && !error && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-border/80 bg-card/40 space-y-3">
            <div className="p-3 rounded-full bg-secondary-bg text-secondary-text">
              <Search className="w-6 h-6 opacity-60" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No relevant media found</h3>
            <p className="text-xs text-secondary-text max-w-sm">
              We couldn&apos;t find any visual evidence closely matching &ldquo;{activeSearchedQuery}&rdquo; in this project. Try using broader descriptive words.
            </p>
          </div>
        )}

        {/* Initial Empty State */}
        {!isLoading && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-xl border border-dashed border-border/60 bg-card/20 space-y-2">
            <Sparkles className="w-8 h-8 text-primary/60 mb-1" />
            <h3 className="text-sm font-semibold text-foreground">
              Search this project&apos;s media using natural language
            </h3>
            <p className="text-xs text-secondary-text max-w-md">
              Type what you are looking for in plain English. The AI matches the visual content of the photographs directly against your query vector.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
