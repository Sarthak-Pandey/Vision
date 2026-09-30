'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Filter, Database, Loader2, AlertCircle, ArrowRight, FolderKanban } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
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

  const projectOptions = [
    { value: 'all', label: 'All Projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Search Evidence</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Query field evidence across projects using 1536-dimensional semantic vector search.
        </p>
      </div>

      {/* Big Search Input */}
      <form onSubmit={handleSearch} className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe what you want to find (e.g. saplings, cleared riverbank, solar microgrid)..."
              className="w-full h-12 pl-12 pr-4 text-sm bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-background focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="sm:w-56 shrink-0">
            <Select
              options={projectOptions}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="h-12 px-6 shrink-0 gap-2 font-semibold">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search</span>
          </Button>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span className="font-medium text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-foreground" />
            Try:
          </span>
          {SAMPLE_QUERIES.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleSearch(undefined, sample)}
              className="px-2.5 py-1 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border border-border text-xs cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />
          <p className="text-sm font-medium text-primary-text">Computing vector similarities across pgvector embeddings...</p>
        </div>
      ) : hasSearched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-secondary-text border-b border-border pb-2">
            <span>Results matching "{activeQuery}"</span>
            <span className="font-medium">{results.length} evidence asset{results.length === 1 ? '' : 's'} found</span>
          </div>

          {results.length === 0 ? (
            <div className="py-16 text-center bg-card text-card-foreground border border-border rounded-2xl space-y-3">
              <Database className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">No matching evidence found</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Try broadening your search query or indexing newly uploaded media assets.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center bg-card text-card-foreground border border-border rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted text-foreground flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Natural Language Semantic Search</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Search by describing visual features, actions, or conditions. pgvector measures cosine similarity between your query and ingested media.
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
