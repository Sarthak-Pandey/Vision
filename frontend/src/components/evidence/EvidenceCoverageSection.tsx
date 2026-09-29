'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  FileQuestion,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  EvidenceGapReport,
  EvidenceCategoryStatus,
  EvidenceCategorySource,
  MediaAssetWithAnalysis,
} from '@/types';
import { getEvidenceGaps } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';

interface EvidenceCoverageSectionProps {
  projectId: string;
  projectName: string;
  onAssetSelect?: (asset: MediaAssetWithAnalysis) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const EvidenceCoverageSection: React.FC<EvidenceCoverageSectionProps> = ({
  projectId,
  projectName,
  onAssetSelect,
  onNavigateToTab,
}) => {
  const [report, setReport] = useState<EvidenceGapReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const fetchGaps = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await getEvidenceGaps(projectId);
      setReport(data);
    } catch (err: any) {
      console.error('[EvidenceCoverageSection] Failed to load evidence gaps:', err);
      setErrorMessage(err.message || 'Unable to analyze evidence coverage right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, [projectId]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const data = await getEvidenceGaps(projectId);
      setReport(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to refresh evidence coverage.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenSource = (source: EvidenceCategorySource) => {
    if (!onAssetSelect) return;
    const fallbackAsset: MediaAssetWithAnalysis = {
      id: source.assetId,
      project_id: projectId,
      url: source.url || '',
      type: (source.type as any) || 'image',
      capture_date: source.captureDate || null,
      created_at: new Date().toISOString(),
    };
    onAssetSelect(fallbackAsset);
  };

  const formatProjectType = (type?: string) => {
    if (!type || type === 'other') return 'Custom / Unconfigured';
    return type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Date unspecified';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Date unspecified';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 rounded-2xl bg-card border border-border animate-pulse space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-secondary-bg rounded-md" />
            <div className="h-4 w-72 bg-secondary-bg rounded-md" />
          </div>
          <div className="h-10 w-24 bg-secondary-bg rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="h-44 bg-secondary-bg rounded-xl" />
          <div className="h-44 bg-secondary-bg rounded-xl" />
        </div>
      </div>
    );
  }

  if (errorMessage || !report) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div>
            <h4 className="font-bold text-sm">Failed to evaluate evidence coverage</h4>
            <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchGaps} className="text-xs shrink-0">
          Retry
        </Button>
      </div>
    );
  }

  const availableCategories = report.categories.filter((c) => c.status === 'available');
  const missingCategories = report.categories.filter((c) => c.status === 'missing');

  return (
    <div className="space-y-6">
      {/* Top Coverage Dashboard Card */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 rounded-2xl p-6 text-white shadow-md border border-teal-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Phase 7: Deterministic Evidence Gap Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Evidence Requirements & Coverage
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Rule-based evaluation comparing expected intervention evidence against verified field records.
              Identifies available proof and pinpoints what evidence should be collected next.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2 text-xs font-semibold backdrop-blur-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Re-evaluating...' : 'Refresh Coverage'}</span>
            </Button>
          </div>
        </div>

        {/* Coverage Progress Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">
              Project Type
            </div>
            <div className="text-base font-bold text-white mt-1 truncate">
              {formatProjectType(report.projectType)}
            </div>
            <div className="text-[11px] text-teal-300 mt-0.5">
              {report.projectTypeConfigured ? 'Rule template active' : 'Custom taxonomy'}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">
              Evidence Coverage
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">
              {report.coverage.percentage}%
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {report.coverage.available} of {report.coverage.expected} categories verified
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">
              Verified Available
            </div>
            <div className="text-2xl font-extrabold text-teal-300 mt-0.5">
              {availableCategories.length}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">Grounded in media</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-slate-300 font-medium uppercase tracking-wider">
              Evidence Gaps
            </div>
            <div className="text-2xl font-extrabold text-amber-300 mt-0.5">
              {missingCategories.length}
            </div>
            <div className="text-[11px] text-amber-200 mt-0.5">Awaiting collection</div>
          </div>
        </div>

        {/* Progress Bar */}
        {report.projectTypeConfigured && (
          <div className="mt-4 pt-2">
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${report.coverage.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Unconfigured Project Type Callout */}
      {!report.projectTypeConfigured && (
        <div className="p-4 rounded-xl bg-secondary-bg border border-border flex items-start gap-3">
          <Info className="w-5 h-5 text-secondary-text shrink-0 mt-0.5" />
          <div className="text-xs text-secondary-text space-y-1">
            <p className="font-semibold text-primary-text">
              Evidence requirements are not configured for this project type yet.
            </p>
            <p>
              Expected evidence rules apply automatically to configured intervention categories
              (Tree Plantation, River Restoration, Solar Installation, Waste Cleanup). Existing
              media and observations are still recorded and displayed below.
            </p>
          </div>
        </div>
      )}

      {/* Main Two-Column Coverage Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMN 1: Evidence Available */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-primary-text">
                Evidence Available ({availableCategories.length})
              </h3>
            </div>
            <span className="text-[11px] text-muted-text font-medium">Verified by field media</span>
          </div>

          {availableCategories.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-card border border-dashed border-border space-y-2">
              <FileQuestion className="w-8 h-8 text-muted-text mx-auto" />
              <p className="text-xs font-semibold text-primary-text">No evidence categories available yet</p>
              <p className="text-[11px] text-secondary-text max-w-xs mx-auto">
                Upload media and perform AI Vision analysis or Before/After comparisons to satisfy
                requirements.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableCategories.map((cat) => {
                const isExpanded = expandedCategory === cat.category;
                return (
                  <div
                    key={cat.category}
                    className="bg-card rounded-xl border border-emerald-200/80 shadow-sm overflow-hidden transition-all hover:border-emerald-400"
                  >
                    <div
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                      className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-emerald-50/20"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary-text">{cat.label}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {cat.evidenceCount} {cat.evidenceCount === 1 ? 'source' : 'sources'}
                            </span>
                          </div>
                          <p className="text-[11px] text-secondary-text leading-relaxed">
                            {cat.explanation}
                          </p>
                        </div>
                      </div>

                      <button
                        className="text-secondary-text hover:text-primary-text p-1 shrink-0"
                        aria-label={isExpanded ? 'Collapse sources' : 'Expand sources'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Supporting Sources Tray */}
                    {isExpanded && cat.sources.length > 0 && (
                      <div className="bg-secondary-bg/40 border-t border-border p-3.5 space-y-2.5">
                        <div className="text-[11px] font-semibold text-secondary-text">
                          Supporting Verified Media Assets:
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {cat.sources.map((src) => (
                            <div
                              key={src.assetId}
                              onClick={() => handleOpenSource(src)}
                              className="group cursor-pointer rounded-lg border border-border hover:border-emerald-500 bg-card p-2 text-xs space-y-1.5 transition-all w-36 hover:shadow-sm"
                            >
                              <div className="relative aspect-video rounded overflow-hidden bg-slate-900 border border-border">
                                {src.url ? (
                                  <img
                                    src={src.url}
                                    alt={`Evidence for ${cat.label}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">
                                    Unavailable
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>View</span>
                                </div>
                              </div>
                              <div className="text-[10px] text-secondary-text truncate font-mono">
                                {src.assetId}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMN 2: Evidence Missing (Gaps) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-primary-text">
                Evidence Gaps ({missingCategories.length})
              </h3>
            </div>
            <span className="text-[11px] text-muted-text font-medium">To be collected</span>
          </div>

          {missingCategories.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-card border border-border space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-primary-text">
                All configured evidence categories are represented!
              </h4>
              <p className="text-[11px] text-secondary-text max-w-xs mx-auto">
                Every expected evidence category currently has supporting field records.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {missingCategories.map((cat) => (
                <div
                  key={cat.category}
                  className="bg-card rounded-xl border border-amber-200/80 shadow-sm p-4 space-y-2.5 hover:border-amber-300 transition-all"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary-text">{cat.label}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Missing
                        </span>
                      </div>
                      <p className="text-[11px] text-secondary-text">{cat.explanation}</p>
                    </div>
                  </div>

                  {/* Suggested Next Action */}
                  {cat.suggestedNextAction && (
                    <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-2.5 flex items-start gap-2 text-[11px] text-amber-900">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-semibold text-amber-950">Suggested next collection: </span>
                        <span>{cat.suggestedNextAction}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
