'use client';

import React, { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Images,
  Activity as ActivityIcon,
  Clock,
  ShieldAlert,
  UploadCloud,
  Edit,
  Trash2,
  Sparkles,
  Layers,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { MediaCard } from '@/components/ui/MediaCard';
import { UploadMediaModal } from '@/components/media/UploadMediaModal';
import { MediaDetailModal } from '@/components/media/MediaDetailModal';
import { EditProjectModal } from '@/components/projects/EditProjectModal';
import { DeleteProjectModal } from '@/components/projects/DeleteProjectModal';
import { ProjectStats } from '@/components/projects/ProjectStats';
import { ProjectOverviewCard } from '@/components/projects/ProjectOverviewCard';
import { ActivitySummary } from '@/components/projects/ActivitySummary';
import { LocationSummary } from '@/components/projects/LocationSummary';
import { RecentMedia } from '@/components/projects/RecentMedia';
import { ProjectTimeline } from '@/components/projects/ProjectTimeline';
import { SemanticSearchSection } from '@/components/search/SemanticSearchSection';
import { BeforeAfterSection } from '@/components/comparisons/BeforeAfterSection';
import { EvidenceClaimsSection } from '@/components/evidence/EvidenceClaimsSection';
import { EvidenceCoverageSection } from '@/components/evidence/EvidenceCoverageSection';
import { ImpactReportView } from '@/components/reports/ImpactReportView';
import { getProject, getAssets, getProjectImpactReport } from '@/lib/api/client';

import { Project, MediaAsset, MediaAssetWithAnalysis, ImpactReport } from '@/types';
import { calculateProjectStats } from '@/lib/utils/projectStats';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [projectAssets, setProjectAssets] = useState<MediaAssetWithAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssetForInspection, setSelectedAssetForInspection] = useState<MediaAssetWithAnalysis | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
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

  // Compute stats deterministically from assets and AI analysis
  const stats = useMemo(() => {
    return calculateProjectStats(projectAssets);
  }, [projectAssets]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'claims', label: 'Evidence & Claims' },
    { id: 'gaps', label: 'Evidence Gaps' },
    { id: 'comparisons', label: 'Before / After' },
    { id: 'search', label: 'AI Search' },
    { id: 'report', label: 'Impact Report' },
    { id: 'media', label: 'Media', count: stats.mediaCount },
    { id: 'activities', label: 'Activities', count: stats.activityCount },
    { id: 'locations', label: 'Locations', count: stats.locationCount },
    { id: 'timeline', label: 'Timeline' },
  ];


  const formatDateRange = (start?: string | null, end?: string | null) => {
    const formatSingle = (str?: string | null) => {
      if (!str) return null;
      try {
        const d = new Date(str);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } catch {
        return null;
      }
    };
    const s = formatSingle(start);
    const e = formatSingle(end);

    if (s && e) return `${s} → ${e}`;
    if (s) return `From ${s}`;
    if (e) return `Until ${e}`;
    return 'Date range unspecified';
  };

  const handleAssetUploaded = (_newAsset: MediaAsset) => {
    loadData();
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProject(updatedProject);
    loadData();
  };

  const handleProjectDeleted = () => {
    router.push('/projects');
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
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-secondary-text hover:text-primary-text mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
        <EmptyState
          icon={<ShieldAlert className="w-8 h-8 text-status-error" />}
          title="Project not found"
          description={error || 'The requested project could not be found or you do not have permission.'}
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
      {/* Navigation & Header */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-text hover:text-brand-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Projects</span>
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-text tracking-tight">
            🌊 {project.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-secondary-text mt-1.5 font-medium">
            {project.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-muted-text" />
                {project.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-text" />
              {formatDateRange(project.start_date, project.end_date)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-auto">
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Project</span>
          </Button>

          {!user?.isGuest && (
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(true)}
              className="gap-1.5 text-xs text-status-error border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setActiveTab('claims')}
            className={`gap-1.5 shrink-0 text-xs ${
              activeTab === 'claims'
                ? 'bg-teal-700 text-white border-teal-700'
                : 'border-teal-300 text-teal-700 hover:bg-teal-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Evidence & Claims</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setActiveTab('comparisons')}
            className={`gap-1.5 shrink-0 text-xs ${
              activeTab === 'comparisons'
                ? 'bg-brand-dark-orange text-white border-brand-dark-orange'
                : 'border-orange-300 text-brand-dark-orange hover:bg-orange-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Before / After</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setActiveTab('search')}
            className={`gap-1.5 shrink-0 text-xs ${
              activeTab === 'search'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-primary/40 text-primary hover:bg-primary/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Search</span>
          </Button>

          <Link href={`/projects/${project.id}/report`}>
            <Button
              variant="outline"
              className="gap-1.5 shrink-0 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-semibold shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Impact Report</span>
            </Button>
          </Link>

          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="gap-2 shrink-0 text-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Media</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab: Evidence & Claims (Phase 6) */}
      {activeTab === 'claims' && (
        <div className="animate-in fade-in duration-200">
          <EvidenceClaimsSection
            projectId={project.id}
            projectName={project.name}
            projectAssets={projectAssets}
            onAssetSelect={setSelectedAssetForInspection}
          />
        </div>
      )}

      {/* Tab: Evidence Gaps & Coverage (Phase 7) */}
      {activeTab === 'gaps' && (
        <div className="animate-in fade-in duration-200">
          <EvidenceCoverageSection
            projectId={project.id}
            projectName={project.name}
            onAssetSelect={setSelectedAssetForInspection}
            onNavigateToTab={setActiveTab}
          />
        </div>
      )}

      {/* Tab: Before / After Intelligence */}
      {activeTab === 'comparisons' && (
        <div className="animate-in fade-in duration-200">
          <BeforeAfterSection
            projectId={project.id}
            projectName={project.name}
            assets={projectAssets}
            onAssetSelect={setSelectedAssetForInspection}
          />
        </div>
      )}

      {/* Tab: Semantic Search */}
      {activeTab === 'search' && (
        <div className="animate-in fade-in duration-200">
          <SemanticSearchSection
            projectId={project.id}
            projectName={project.name}
            onAssetSelect={setSelectedAssetForInspection}
          />
        </div>
      )}

      {/* Tab: Project Impact Report (Phase 9) */}
      {activeTab === 'report' && (
        <div className="animate-in fade-in duration-200">
          <ProjectReportTabContent projectId={project.id} />
        </div>
      )}


      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <ProjectStats stats={stats} />

          <ProjectOverviewCard project={project} />

          <RecentMedia
            assets={projectAssets}
            projectName={project.name}
            onViewAllClick={() => setActiveTab('media')}
            onAssetClick={setSelectedAssetForInspection}
            onUploadClick={() => setIsUploadModalOpen(true)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivitySummary activities={stats.activities} />
            <LocationSummary locations={stats.locations} />
          </div>
        </div>
      )}

      {/* Tab 2: Media */}
      {activeTab === 'media' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary-text">
              Showing {projectAssets.length} visual media assets for {project.name}.
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
              description="Upload field photos or videos to start building project media intelligence."
              action={
                <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2">
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Media</span>
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

      {/* Tab 3: Activities */}
      {activeTab === 'activities' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <ActivitySummary activities={stats.activities} />
        </div>
      )}

      {/* Tab 4: Locations */}
      {activeTab === 'locations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <LocationSummary locations={stats.locations} />
        </div>
      )}

      {/* Tab 5: Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <ProjectTimeline
            timeline={stats.timeline}
            undatedCount={stats.undatedAssetsCount}
            projectName={project.name}
            onAssetClick={setSelectedAssetForInspection}
          />
        </div>
      )}

      {/* Upload Media Modal */}
      <UploadMediaModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={handleAssetUploaded}
        defaultProjectId={project.id}
      />

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={project}
          onUpdated={handleProjectUpdated}
        />
      )}

      {/* Delete Project Modal */}
      {isDeleteModalOpen && (
        <DeleteProjectModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          project={project}
          onDeleted={handleProjectDeleted}
        />
      )}

      {/* Evidence Inspector Modal */}
      {selectedAssetForInspection && (
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
              setSelectedAssetForInspection((prev) =>
                prev ? { ...prev, ai_analysis: analysis } : null
              );
            }
          }}
        />
      )}
    </div>
  );
}

function ProjectReportTabContent({ projectId }: { projectId: string }) {
  const [report, setReport] = useState<ImpactReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProjectImpactReport(projectId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load project report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
        <div className="inline-block animate-spin text-brand-primary">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Composing project impact report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center text-sm text-rose-600 bg-white rounded-2xl border border-rose-200 space-y-3">
        <p>{error || 'Failed to generate report.'}</p>
        <Button variant="outline" size="sm" onClick={loadReport}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href={`/projects/${projectId}/report`}>
          <Button variant="outline" className="gap-1.5 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Open Dedicated Print-Ready Page</span>
          </Button>
        </Link>
      </div>
      <ImpactReportView report={report} onRefresh={loadReport} />
    </div>
  );
}

