'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UploadCloud, Images, RefreshCw, AlertCircle, Sparkles, MapPin, Filter, Search, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
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

  const verifiedCount = useMemo(() => {
    return assets.filter((a) => !!a.ai_analysis).length;
  }, [assets]);

  const geotaggedCount = useMemo(() => {
    return assets.filter((a) => !!a.latitude && !!a.longitude).length;
  }, [assets]);

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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Media Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 text-zinc-500 dark:text-white/50 text-[11px] font-mono">
              {assets.length}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-white/50 mt-1 max-w-lg">
            High-resolution visual evidence repository with automated spatial analysis, activity detection, and verification logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] text-zinc-600 dark:text-white/70 hover:text-zinc-950 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Refresh assets"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-black font-semibold text-xs px-4 py-2 transition-all hover:bg-zinc-800 dark:hover:bg-white/90 active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Media</span>
          </Button>
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
          <span className="text-xs font-medium text-zinc-500 dark:text-white/50">Total Assets</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-semibold text-zinc-950 dark:text-white tracking-tight">{assets.length}</span>
            <span className="text-[11px] text-zinc-500 dark:text-white/40 font-mono">In Vault</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-white/50">AI Verified</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-semibold text-zinc-950 dark:text-white tracking-tight">{verifiedCount}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {assets.length > 0 ? `${Math.round((verifiedCount / assets.length) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-white/50">Geotagged GPS</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-semibold text-zinc-950 dark:text-white tracking-tight">{geotaggedCount}</span>
            <span className="text-[11px] text-sky-600 dark:text-sky-300 font-medium">Logged</span>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-white/50">Vector Index</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-semibold text-zinc-950 dark:text-white tracking-tight">1536-dim Active</span>
          </div>
        </div>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 liquid-glass p-2.5 rounded-xl"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 dark:text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by project, uploader, activity, scene..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/[0.03] dark:bg-white/[0.04] text-zinc-950 dark:text-white text-xs rounded-lg pl-9 pr-4 py-2 border border-black/[0.08] dark:border-white/[0.08] placeholder:text-zinc-400 dark:placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 dark:focus:border-white/30 focus:bg-black/[0.05] dark:focus:bg-white/[0.07] transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-full sm:w-60">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] text-zinc-950 dark:text-white text-xs rounded-lg px-3 py-2 border border-black/[0.08] dark:border-white/[0.08] focus:outline-none focus:border-blue-500/50 dark:focus:border-white/30 focus:bg-black/[0.05] dark:focus:bg-white/[0.07] transition-all cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-[#0c0c0c] text-zinc-900 dark:text-white">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#0c0c0c] text-zinc-900 dark:text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-white/50 font-medium px-2 whitespace-nowrap hidden sm:block">
            {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
          </div>
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <div className="p-4 liquid-glass bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-500 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="liquid-glass rounded-2xl border border-black/10 dark:border-white/10 animate-pulse overflow-hidden">
              <div className="aspect-4/3 w-full bg-black/[0.04] dark:bg-white/[0.04]" />
              <div className="p-3.5 space-y-2">
                <div className="h-3 bg-black/[0.06] dark:bg-white/[0.06] rounded w-3/4" />
                <div className="h-2.5 bg-black/[0.04] dark:bg-white/[0.04] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="liquid-glass rounded-2xl border border-black/10 dark:border-white/10 p-12 text-center">
          <EmptyState
            icon={<Images className="w-8 h-8 text-zinc-400 dark:text-white/30" />}
            title="No media evidence found"
            description={
              searchTerm || selectedProjectId !== 'all'
                ? 'No media matches your search filters. Try clearing your filters or selecting a different project.'
                : 'Start ingesting field photos and videos to build your verifiable ground-truth evidence.'
            }
            action={
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-4 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black font-semibold text-xs px-5 py-2.5 hover:bg-zinc-800 dark:hover:bg-white/90"
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                <span>Upload First Asset</span>
              </Button>
            }
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {filteredAssets.map((asset) => (
            <MediaCard
              key={asset.id}
              asset={asset}
              projectName={projectMap.get(asset.project_id) || 'Unknown Project'}
              onClick={() => setSelectedAssetForInspection(asset)}
            />
          ))}
        </motion.div>
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

