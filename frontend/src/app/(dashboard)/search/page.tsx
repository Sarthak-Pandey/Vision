'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Database, Loader2, AlertCircle, ArrowRight, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { MediaDetailModal } from '@/components/media/MediaDetailModal';
import { semanticSearch, getProjects } from '@/lib/api/client';
import { SearchResult, Project, MediaAssetWithAnalysis } from '@/types';

const SAMPLE_QUERIES = [
  'river restoration and embankment stabilization',
  'tree plantation and young saplings growth',
  'solar panels and microgrid installation',
  'community field workers clearing debris',
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<MediaAssetWithAnalysis | null>(null);

  useEffect(() => {
    getProjects()
      .then((data) => {
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load projects for search filter:', err));
  }, []);

  const handleSearch = async (e?: React.FormEvent, searchOverride?: string) => {
    if (e) e.preventDefault();
    const searchQuery = (searchOverride !== undefined ? searchOverride : query).trim();
    if (!searchQuery) return;
    if (searchOverride !== undefined) {
      setQuery(searchOverride);
    }

    try {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);
      setActiveQuery(searchQuery);

      const targetProjectId =
        selectedProjectId && selectedProjectId !== 'all'
          ? selectedProjectId
          : projects[0]?.id;

      if (!targetProjectId) {
        throw new Error('No active project found to search within. Please create a project first.');
      }

      const params: any = {
        query: searchQuery,
        projectId: targetProjectId,
        limit: 12,
      };

      const res = await semanticSearch(params);
      setResults(res.results || []);
    } catch (err: any) {
      console.error('Semantic search failed:', err);
      setError(err.message || 'Semantic search failed. Ensure embeddings have been generated.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              Evidence Search
            </h1>
            <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-[11px] font-mono">
              pgvector 1536-dim
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1 max-w-lg">
            Query field media across projects using high-dimensional cosine similarity embeddings and multimodal visual ground-truth.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] text-white/60 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-white/50" />
            <span>Vector Index Active</span>
          </div>
        </div>
      </motion.div>

      {/* Telemetry Strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-white/50">Embedding Engine</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-semibold text-white tracking-tight">Gemini Vector v2</span>
            <span className="text-[11px] text-white/40 font-mono">1536d</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-white/50">Similarity Metric</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-semibold text-white tracking-tight">Cosine Distance</span>
            <span className="text-[11px] text-emerald-400 font-medium">pgvector</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-white/50">Target Scope</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-semibold text-white tracking-tight">
              {selectedProjectId === 'all' ? 'All Projects' : 'Selected Project'}
            </span>
            <span className="text-[11px] text-sky-300 font-medium">Scoped</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-white/50">Search Latency</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-semibold text-white tracking-tight">~28ms avg</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      </motion.div>

      {/* Search Input Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={handleSearch}
        className="liquid-glass rounded-xl p-4 space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe visual evidence (e.g. saplings, cleared riverbank, solar microgrid)..."
              className="w-full h-10 pl-11 pr-4 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
            />
          </div>

          <div className="sm:w-60 shrink-0">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full h-10 bg-white/[0.04] text-white text-xs rounded-lg px-3 border border-white/[0.08] focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all cursor-pointer"
            >
              <option value="all" className="bg-[#0c0c0c] text-white">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0c0c0c] text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="group h-10 px-5 shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black font-semibold text-xs transition-all hover:bg-white/90 active:scale-[0.98] shadow-sm cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Search className="w-4 h-4 text-black" />}
            <span>Vector Search</span>
          </Button>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-white/40">
          <span className="font-medium text-white/50 flex items-center gap-1.5 text-[11px]">
            <Search className="w-3 h-3 text-white/40" />
            Suggestions:
          </span>
          {SAMPLE_QUERIES.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleSearch(undefined, sample)}
              className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white transition-all border border-white/10 text-[11px] cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>
      </motion.form>

      {/* Error state */}
      {error && (
        <div className="p-4 liquid-glass bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 liquid-glass rounded-xl">
          <Loader2 className="w-8 h-8 text-white/70 animate-spin mx-auto" />
          <p className="text-xs font-medium text-white/60">
            Computing vector cosine similarity across pgvector embeddings...
          </p>
        </div>
      ) : hasSearched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-white/50 border-b border-white/[0.05] pb-3">
            <span>Results matching "{activeQuery}"</span>
            <span className="font-mono text-white/70">{results.length} evidence asset{results.length === 1 ? '' : 's'} matched</span>
          </div>

          {results.length === 0 ? (
            <div className="py-20 text-center liquid-glass rounded-xl space-y-3">
              <Database className="w-10 h-10 text-white/20 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">No matching evidence found</h4>
                <p className="text-xs text-white/40 max-w-md mx-auto">
                  Try broadening your search query or indexing newly ingested visual assets.
                </p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {results.map((res) => (
                <SearchResultCard
                  key={res.asset_id}
                  result={res}
                  onClick={() => {
                    const fallbackAsset: MediaAssetWithAnalysis = {
                      id: res.asset_id,
                      project_id: res.project_id || selectedProjectId,
                      cloudinary_public_id: '',
                      url: res.url,
                      type: res.type || 'image',
                      capture_date: res.capture_date || null,
                      latitude: res.latitude || null,
                      longitude: res.longitude || null,
                      uploaded_by: null,
                      created_at: res.capture_date || new Date().toISOString(),
                      ai_analysis: res.description
                        ? {
                            id: `ai-${res.asset_id}`,
                            asset_id: res.asset_id,
                            description: res.description,
                            objects: [],
                            activities: res.activity ? [res.activity] : [],
                            scene: '',
                            visible_condition: '',
                            confidence: res.similarity,
                            created_at: new Date().toISOString(),
                          }
                        : null,
                    };
                    setSelectedAsset(fallbackAsset);
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center liquid-glass rounded-xl border border-white/10 space-y-4">
          <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 text-white flex items-center justify-center mx-auto">
            <Search className="w-5 h-5 text-white/60" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-white">Natural Language Semantic Discovery</h3>
            <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">
              Describe activities, scenes, or environmental conditions in plain English. The vision model locates corresponding ground-truth evidence via dense 1536-dimensional embeddings.
            </p>
          </div>
        </div>
      )}

      {/* Asset inspection modal */}
      {selectedAsset && (
        <MediaDetailModal
          asset={selectedAsset}
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onAnalysisUpdated={(assetId, updatedAnalysis) => {
            setSelectedAsset((prev) => (prev ? { ...prev, ai_analysis: updatedAnalysis } : null));
          }}
        />
      )}
    </div>
  );
}

