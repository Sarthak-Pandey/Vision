'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UploadCloud, Images, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { MediaCard } from '@/components/ui/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { UploadMediaModal } from '@/components/media/UploadMediaModal';
import { MediaDetailModal } from '@/components/media/MediaDetailModal';
import { getAssets, getProjects } from '@/lib/api/client';
import { MediaAssetWithAnalysis, Project, AiAnalysis } from '@/types';

export default function MediaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [assets, setAssets] = useState<MediaAssetWithAnalysis[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedAssetForInspection, setSelectedAssetForInspection] = useState<MediaAssetWithAnalysis | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [fetchedAssets, fetchedProjects] = await Promise.all([
        getAssets(),
        getProjects(),
      ]);
      setAssets(fetchedAssets);
      setProjects(fetchedProjects);
    } catch (err: any) {
      console.error('Error fetching media:', err);
      setError(err.message || 'Failed to fetch media assets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [projects]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Filter by project
      if (selectedProjectId !== 'all' && asset.project_id !== selectedProjectId) {
        return false;
      }

      // Filter by search query (project name, uploader, or id)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const pName = (projectMap.get(asset.project_id) || '').toLowerCase();
        const uploader = (asset.uploaded_by || '').toLowerCase();
        const assetId = asset.id.toLowerCase();
        const activity = (asset.ai_analysis?.activities || []).join(' ').toLowerCase();
        const scene = (asset.ai_analysis?.scene || '').toLowerCase();
        return (
          pName.includes(query) ||
          uploader.includes(query) ||
          assetId.includes(query) ||
          activity.includes(query) ||
          scene.includes(query)
        );
      }

      return true;
    });
  }, [assets, selectedProjectId, searchTerm, projectMap]);

  const handleAssetUploaded = (newAsset: any) => {
    setAssets((prev) => [newAsset, ...prev]);
  };

  const handleAnalysisUpdated = (assetId: string, analysis: AiAnalysis) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, ai_analysis: analysis } : a))
    );
    if (selectedAssetForInspection && selectedAssetForInspection.id === assetId) {
      setSelectedAssetForInspection((prev) => (prev ? { ...prev, ai_analysis: analysis } : null));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight">Media Evidence</h1>
          <p className="text-sm text-secondary-text mt-0.5">
            Ingest, organize, and inspect visual evidence with automated AI verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={isLoading}
            className="gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="gap-2 shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Media</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search by project, uploader, activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-full sm:w-56">
            <Select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              options={[
                { value: 'all', label: 'All Projects' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
        </div>

        <div className="ml-auto text-xs text-secondary-text font-medium px-2 hidden sm:block">
          {filteredAssets.length} {filteredAssets.length === 1 ? 'item' : 'items'}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-status-error flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse bg-card border border-border rounded-xl overflow-hidden p-0 shadow-2xs">
              <div className="aspect-4/3 w-full bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded-md w-3/4" />
                <div className="h-2.5 bg-muted/60 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <EmptyState
          icon={<Images className="w-8 h-8 text-secondary-text" />}
          title="No media evidence found"
          description={
            searchTerm || selectedProjectId !== 'all'
              ? 'No media matches your search filters. Try clearing your filters or selecting a different project.'
              : 'Start ingesting field photos and videos to build your verifiable impact portfolio.'
          }
          action={
            <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>Upload First Asset</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <MediaCard
              key={asset.id}
              asset={asset}
              projectName={projectMap.get(asset.project_id) || 'Unknown Project'}
              onClick={() => setSelectedAssetForInspection(asset)}
            />
          ))}
        </div>
      )}

      {/* Upload Media Modal */}
      <UploadMediaModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={handleAssetUploaded}
        defaultProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
      />

      {/* Media Detail & Evidence Inspector Modal */}
      <MediaDetailModal
        isOpen={!!selectedAssetForInspection}
        onClose={() => setSelectedAssetForInspection(null)}
        asset={selectedAssetForInspection}
        projectName={
          selectedAssetForInspection
            ? projectMap.get(selectedAssetForInspection.project_id)
            : undefined
        }
        onAnalysisUpdated={handleAnalysisUpdated}
      />
    </div>
  );
}
