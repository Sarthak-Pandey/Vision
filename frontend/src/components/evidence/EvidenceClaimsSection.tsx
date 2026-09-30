'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  Sparkles,
  Layers,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  Image as ImageIcon,
  Clock,
  ArrowRight,
  Eye,
  Tag,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import {
  EvidenceClaim,
  ClaimsTelemetry,
  ClaimSourceType,
  MediaAssetWithAnalysis,
  EvidenceAsset,
} from '@/types';
import {
  getProjectClaims,
  syncProjectClaims,
  GetClaimsFilters,
} from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfidenceIndicator } from './ConfidenceIndicator';

interface EvidenceClaimsSectionProps {
  projectId: string;
  projectName: string;
  projectAssets: MediaAssetWithAnalysis[];
  onAssetSelect?: (asset: MediaAssetWithAnalysis) => void;
}

export const EvidenceClaimsSection: React.FC<EvidenceClaimsSectionProps> = ({
  projectId,
  projectName,
  projectAssets,
  onAssetSelect,
}) => {
  const [claims, setClaims] = useState<EvidenceClaim[]>([]);
  const [telemetry, setTelemetry] = useState<ClaimsTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'asset_analysis' | 'comparison' | 'low_confidence'>('all');
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);

  // Asset lookup map for instant inspection modal opening
  const assetMap = useMemo(() => {
    const map = new Map<string, MediaAssetWithAnalysis>();
    for (const a of projectAssets) {
      map.set(a.id, a);
    }
    return map;
  }, [projectAssets]);

  const fetchClaims = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const filters: GetClaimsFilters = {};
      if (selectedFilter === 'asset_analysis' || selectedFilter === 'comparison') {
        filters.sourceType = selectedFilter;
      } else if (selectedFilter === 'low_confidence') {
        // low confidence filter: we filter client-side or use query
      }

      const response = await getProjectClaims(projectId, filters);
      setClaims(response.claims || []);
      setTelemetry(response.telemetry || null);
    } catch (err: any) {
      console.error('[EvidenceClaimsSection] Failed to load claims:', err);
      setErrorMessage(err.message || 'Unable to load evidence claims right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [projectId, selectedFilter]);

  const handleSyncClaims = async () => {
    try {
      setIsSyncing(true);
      setErrorMessage(null);
      await syncProjectClaims(projectId);
      await fetchClaims();
    } catch (err: any) {
      console.error('[EvidenceClaimsSection] Sync failed:', err);
      setErrorMessage(err.message || 'Failed to sync project claims from existing media analysis.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter claims based on selected filter tab
  const displayedClaims = useMemo(() => {
    if (selectedFilter === 'low_confidence') {
      return claims.filter((c) => c.confidence < 0.65);
    }
    return claims;
  }, [claims, selectedFilter]);

  const handleOpenAsset = (evidenceItem: EvidenceAsset) => {
    if (!onAssetSelect) return;

    // Check if asset is in projectAssets map
    const existing = assetMap.get(evidenceItem.assetId);
    if (existing) {
      onAssetSelect(existing);
      return;
    }

    // Fallback: create compatible MediaAssetWithAnalysis wrapper
    const fallbackAsset: MediaAssetWithAnalysis = {
      id: evidenceItem.assetId,
      project_id: projectId,
      url: evidenceItem.url,
      type: (evidenceItem.type as any) || 'image',
      capture_date: evidenceItem.captureDate || null,
      latitude: evidenceItem.latitude || null,
      longitude: evidenceItem.longitude || null,
      uploaded_by: evidenceItem.uploadedBy || null,
      created_at: new Date().toISOString(),
    };
    onAssetSelect(fallbackAsset);
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (confidence >= 0.65) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-teal-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Phase 6: Traceable Evidence Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Evidence & Observation Claims
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Every statement below is bound to verified original media. Click any claim or evidence
              asset to trace the observation back to the original source.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleSyncClaims}
              disabled={isSyncing || isLoading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2 text-xs font-semibold backdrop-blur-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync From Media'}</span>
            </Button>
          </div>
        </div>

        {/* Telemetry Summary Cards */}
        {telemetry && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-slate-300 font-medium">Total Claims</div>
              <div className="text-2xl font-extrabold text-white mt-1">{telemetry.totalClaims}</div>
              <div className="text-[11px] text-teal-400 mt-0.5">Observable records</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-slate-300 font-medium">Evidence-Backed</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                {telemetry.evidenceBackedClaims}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">Linked to original media</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-slate-300 font-medium">Evidence Confidence</div>
              <div className="text-2xl font-extrabold text-amber-300 mt-1">
                {telemetry.averageCompositeConfidence !== undefined
                  ? `${Math.round(telemetry.averageCompositeConfidence * 100)}%`
                  : `${Math.round(telemetry.averageConfidence * 100)}%`}
              </div>
              <div className="text-[11px] text-teal-300 mt-0.5">
                {telemetry.highConfidenceClaims !== undefined
                  ? `${telemetry.highConfidenceClaims} High • ${telemetry.mediumConfidenceClaims || 0} Med`
                  : '5-signal composite heuristic'}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-slate-300 font-medium">Sources Breakdown</div>
              <div className="text-sm font-semibold text-white mt-1.5 flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-indigo-300">
                  <Sparkles className="w-3 h-3" /> {telemetry.analysisSourcesCount} single
                </span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1 text-xs text-teal-300">
                  <Layers className="w-3 h-3" /> {telemetry.comparisonSourcesCount} B/A
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">Analysis & comparisons</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary-bg text-secondary-text hover:text-primary-text'
            }`}
          >
            All Claims ({claims.length})
          </button>

          <button
            onClick={() => setSelectedFilter('asset_analysis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedFilter === 'asset_analysis'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary-bg text-secondary-text hover:text-primary-text'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Image Analysis</span>
          </button>

          <button
            onClick={() => setSelectedFilter('comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedFilter === 'comparison'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary-bg text-secondary-text hover:text-primary-text'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Before / After Comparisons</span>
          </button>

          <button
            onClick={() => setSelectedFilter('low_confidence')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedFilter === 'low_confidence'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-secondary-bg text-secondary-text hover:text-primary-text'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Confidence (&lt; 65%)</span>
          </button>
        </div>

        <div className="text-xs text-secondary-text flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Server-verified project scope</span>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load evidence claims</p>
            <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchClaims} className="text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="p-8 rounded-xl bg-card border border-border animate-pulse space-y-4">
            <div className="h-5 w-1/3 bg-secondary-bg rounded" />
            <div className="h-4 w-2/3 bg-secondary-bg rounded" />
            <div className="flex gap-4 pt-4">
              <div className="h-28 w-40 bg-secondary-bg rounded-lg" />
              <div className="h-28 w-40 bg-secondary-bg rounded-lg" />
            </div>
          </div>
          <div className="p-8 rounded-xl bg-card border border-border animate-pulse space-y-4">
            <div className="h-5 w-1/4 bg-secondary-bg rounded" />
            <div className="h-4 w-1/2 bg-secondary-bg rounded" />
          </div>
        </div>
      ) : displayedClaims.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center border border-teal-200">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-primary-text">No evidence-backed claims yet</h3>
            <p className="text-xs text-secondary-text">
              AI-generated observations will appear here once media is analyzed with Phase 2 or
              compared with Phase 5.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              onClick={handleSyncClaims}
              disabled={isSyncing}
              className="gap-2 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Extract Claims From Existing Media</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Claims list */
        <div className="space-y-4">
          {displayedClaims.map((claim) => {
            const isExpanded = expandedClaimId === claim.id;
            const isComparison = claim.sourceType === 'comparison';
            const evidenceCount = claim.evidence ? claim.evidence.length : 0;
            const isLowConfidence = claim.confidence < 0.65;

            return (
              <div
                key={claim.id}
                className="bg-card rounded-2xl border border-border hover:border-border/80 transition-all shadow-sm overflow-hidden"
              >
                {/* Claim Card Header */}
                <div className="p-5 md:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isComparison ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Layers className="w-3 h-3 text-indigo-600" />
                            <span>Source: Before / After Comparison</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                            <Sparkles className="w-3 h-3 text-teal-600" />
                            <span>Source: AI Vision Analysis</span>
                          </span>
                        )}

                        {claim.compositeConfidence ? (
                          <ConfidenceIndicator confidence={claim.compositeConfidence} compact />
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getConfidenceBadgeColor(
                              claim.confidence
                            )}`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>AI Confidence: {Math.round(claim.confidence * 100)}%</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base md:text-lg font-bold text-primary-text leading-snug pt-1">
                        &ldquo;{claim.claim}&rdquo;
                      </h3>
                    </div>

                    <button
                      onClick={() => setExpandedClaimId(isExpanded ? null : claim.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-secondary-text hover:text-primary-text self-start shrink-0 px-2 py-1 rounded-md hover:bg-secondary-bg transition-colors"
                      aria-label={isExpanded ? 'Collapse traceability details' : 'Expand traceability details'}
                    >
                      <span>Traceability</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Traceability route explanation breadcrumb */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-text font-mono bg-secondary-bg/60 px-3 py-1.5 rounded-lg overflow-x-auto">
                    <span className="text-teal-600 font-semibold uppercase">Claim</span>
                    <span>→</span>
                    <span>{evidenceCount} Evidence Assets</span>
                    <span>→</span>
                    <span>Cloudinary Media</span>
                    <span>→</span>
                    <span className="text-emerald-700 font-semibold">Verified Observation</span>
                  </div>

                  {/* Evidence Assets Grid */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs text-secondary-text font-semibold">
                      <span>Supporting Evidence ({evidenceCount} {evidenceCount === 1 ? 'asset' : 'assets'}):</span>
                      <span className="text-[11px] text-muted-text">Click thumbnail to inspect full media</span>
                    </div>

                    {evidenceCount === 0 ? (
                      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Evidence media record unavailable or unlinked for this claim.</span>
                      </div>
                    ) : isComparison ? (
                      /* Side-by-side or stacked Before/After layout */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {claim.evidence.map((ev, idx) => {
                          const isBefore = ev.role === 'before' || idx === 0;
                          return (
                            <div
                              key={ev.assetId}
                              onClick={() => handleOpenAsset(ev)}
                              className="group cursor-pointer rounded-xl border border-border hover:border-teal-500 bg-secondary-bg/30 p-3 transition-all hover:shadow-md space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                    isBefore
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  }`}
                                >
                                  {isBefore ? '1. Before Asset' : '2. After Asset'}
                                </span>
                                <span className="text-[11px] text-muted-text flex items-center gap-1 font-mono">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(ev.captureDate)}
                                </span>
                              </div>

                              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-border">
                                {ev.url ? (
                                  <img
                                    src={ev.url}
                                    alt={`Evidence asset for ${claim.claim}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 p-2 text-center">
                                    <ImageIcon className="w-6 h-6" />
                                    <span className="text-[11px]">Media record unavailable</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-semibold">
                                  <Eye className="w-4 h-4" />
                                  <span>Inspect Source Media</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-secondary-text">
                                <span className="font-mono truncate max-w-[150px]">ID: {ev.assetId}</span>
                                <span className="text-teal-600 font-semibold group-hover:underline flex items-center gap-0.5">
                                  View details <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Single or Multi-Asset Analysis Evidence */
                      <div className="flex flex-wrap gap-3">
                        {claim.evidence.map((ev) => (
                          <div
                            key={ev.assetId}
                            onClick={() => handleOpenAsset(ev)}
                            className="group cursor-pointer rounded-xl border border-border hover:border-teal-500 bg-secondary-bg/30 p-2.5 transition-all hover:shadow-md space-y-2 w-full sm:w-64"
                          >
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-border">
                              {ev.url ? (
                                <img
                                  src={ev.url}
                                  alt={`Evidence for ${claim.claim}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 p-2 text-center">
                                  <ImageIcon className="w-6 h-6" />
                                  <span className="text-[11px]">Media record unavailable</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-semibold">
                                <Eye className="w-4 h-4" />
                                <span>Inspect Media</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-secondary-text">
                              <span className="font-mono text-muted-text truncate max-w-[120px]">
                                {ev.assetId}
                              </span>
                              <span className="text-teal-600 font-semibold group-hover:underline flex items-center gap-0.5">
                                Inspect <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Traceability Details Panel */}
                {isExpanded && (
                  <div className="bg-secondary-bg/50 border-t border-border p-5 text-xs space-y-3 font-sans">
                    <div className="font-bold text-primary-text flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>Audit & Traceability Record</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3 bg-card rounded-lg border border-border">
                        <div className="text-muted-text text-[10px] uppercase font-semibold">Claim ID</div>
                        <div className="font-mono text-primary-text mt-0.5 truncate">{claim.id}</div>
                      </div>

                      <div className="p-3 bg-card rounded-lg border border-border">
                        <div className="text-muted-text text-[10px] uppercase font-semibold">Project Scope</div>
                        <div className="font-mono text-primary-text mt-0.5 truncate">{claim.projectId}</div>
                      </div>

                      <div className="p-3 bg-card rounded-lg border border-border">
                        <div className="text-muted-text text-[10px] uppercase font-semibold">Source Record</div>
                        <div className="font-mono text-primary-text mt-0.5 truncate">
                          {claim.sourceId || 'Direct asset observation'}
                        </div>
                      </div>

                      <div className="p-3 bg-card rounded-lg border border-border">
                        <div className="text-muted-text text-[10px] uppercase font-semibold">Extracted At</div>
                        <div className="text-primary-text mt-0.5">{formatDate(claim.createdAt)}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                      <div className="text-muted-text text-[10px] uppercase font-semibold">
                        Normalized Statement (Deterministic Deduplication Key)
                      </div>
                      <div className="font-mono text-secondary-text bg-secondary-bg p-2 rounded text-[11px]">
                        {claim.normalizedClaim}
                      </div>
                    </div>

                    {/* Phase 8 Multi-Signal Evidence Confidence Breakdown */}
                    {claim.compositeConfidence && (
                      <div className="pt-2">
                        <ConfidenceIndicator confidence={claim.compositeConfidence} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
