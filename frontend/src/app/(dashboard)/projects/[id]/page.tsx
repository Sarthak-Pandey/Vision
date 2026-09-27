'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Images, Activity, Navigation, FileText, Clock, ShieldAlert, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { MediaCard } from '@/components/ui/MediaCard';
import { UploadMediaModal } from '@/components/media/UploadMediaModal';
import { MediaDetailModal } from '@/components/media/MediaDetailModal';
import { getProject, getAssets } from '@/lib/api/client';
import { Project, MediaAsset, MediaAssetWithAnalysis, AiAnalysis } from '@/types';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [projectAssets, setProjectAssets] = useState<MediaAssetWithAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedAssetForInspection, setSelectedAssetForInspection] = useState<MediaAssetWithAnalysis | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projectData, assetsData] = await Promise.all([
        getProject(projectId),
        getAssets(projectId),
      ]);
      setProject(projectData);
      setProjectAssets(assetsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch project details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'media', label: 'Media', count: projectAssets.length },
    { id: 'timeline', label: 'Timeline' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'reports', label: 'Reports' },
  ];

  const handleAssetUploaded = (newAsset: MediaAsset) => {
    if (newAsset.project_id !== projectId) return;
    setProjectAssets((prev) => [newAsset, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-secondary-bg rounded-md" />
        <div className="h-10 w-2/3 bg-secondary-bg rounded-md" />
        <div className="h-40 bg-secondary-bg rounded-xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-12">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-secondary-text hover:text-primary-text mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
        <EmptyState
          icon={<ShieldAlert className="w-8 h-8 text-status-error" />}
          title="Project not found"
          description={error || 'The requested project could not be loaded.'}
          action={
            <Link href="/projects">
              <Button variant="outline">View All Projects</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Back Navigation */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-text hover:text-brand-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Projects</span>
      </Link>

      {/* Project Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-text tracking-tight">
            {project.name}
          </h1>
          <div className="flex items-center gap-4 text-xs text-secondary-text mt-1.5">
            {project.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-muted-text" />
                {project.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-text" />
              {project.start_date || 'Jan 2025'} – {project.end_date || 'Sep 2026'}
            </span>
          </div>
        </div>

        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="gap-2 shrink-0 self-start md:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Evidence</span>
        </Button>
      </div>

      {/* Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Media Assets"
              value={projectAssets.length}
              icon={<Images className="w-4 h-4 text-brand-primary" />}
            />
            <StatCard
              title="Activities"
              value={4}
              icon={<Activity className="w-4 h-4 text-brand-primary" />}
            />
            <StatCard
              title="Locations"
              value={project.location ? 1 : 0}
              icon={<Navigation className="w-4 h-4 text-brand-primary" />}
            />
          </div>

          {/* Project Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary-text leading-relaxed">
                {project.description ||
                  'No description provided for this project. This project tracks field operations, visual media ingestion, and environmental evidence validation.'}
              </p>
            </CardContent>
          </Card>

          {/* Recent Media Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-primary-text">Recent Media Evidence</h3>
              {projectAssets.length > 0 && (
                <button
                  onClick={() => setActiveTab('media')}
                  className="text-xs text-brand-primary font-medium hover:underline"
                >
                  View all ({projectAssets.length})
                </button>
              )}
            </div>

            {projectAssets.length === 0 ? (
              <div className="p-8 text-center bg-white border border-border border-dashed rounded-xl">
                <p className="text-xs text-secondary-text">No visual evidence uploaded for this project yet.</p>
                <Button
                  size="sm"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="mt-3 gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Media</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {projectAssets.slice(0, 4).map((asset) => (
                  <MediaCard
                    key={asset.id}
                    asset={asset}
                    projectName={project.name}
                    onClick={() => setSelectedAssetForInspection(asset)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media tab with full grid */}
      {activeTab === 'media' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary-text">
              Showing {projectAssets.length} visual evidence records for {project.name}.
            </p>
            <Button
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Add Media</span>
            </Button>
          </div>

          {projectAssets.length === 0 ? (
            <EmptyState
              icon={<Images className="w-8 h-8 text-secondary-text" />}
              title="No media in this project"
              description="Upload field photos to document verified project progress."
              action={
                <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2">
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Evidence</span>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {projectAssets.map((asset) => (
                <MediaCard
                  key={asset.id}
                  asset={asset}
                  projectName={project.name}
                  onClick={() => setSelectedAssetForInspection(asset)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <EmptyState
          icon={<Clock className="w-8 h-8 text-muted-text" />}
          title="Project Activity Timeline"
          description="Chronological evidence progression sorted by capture date."
        />
      )}

      {activeTab === 'evidence' && (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-muted-text" />}
          title="Evidence Provenance & Confidence"
          description="AI vision analysis & verified evidence graphs will be attached in Phase 2."
        />
      )}

      {activeTab === 'reports' && (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-muted-text" />}
          title="Project Impact Reports"
          description="Structured PDF & web impact reports will be generated here."
        />
      )}

      {/* Upload Media Modal */}
      <UploadMediaModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={handleAssetUploaded}
        defaultProjectId={project.id}
      />

      {/* Evidence Inspector Modal */}
      <MediaDetailModal
        isOpen={!!selectedAssetForInspection}
        onClose={() => setSelectedAssetForInspection(null)}
        asset={selectedAssetForInspection}
        projectName={project.name}
        onAnalysisUpdated={(assetId, analysis) => {
          setProjectAssets((prev) =>
            prev.map((a) => (a.id === assetId ? { ...a, ai_analysis: analysis } : a))
          );
          if (selectedAssetForInspection && selectedAssetForInspection.id === assetId) {
            setSelectedAssetForInspection((prev) => (prev ? { ...prev, ai_analysis: analysis } : null));
          }
        }}
      />
    </div>
  );
}
