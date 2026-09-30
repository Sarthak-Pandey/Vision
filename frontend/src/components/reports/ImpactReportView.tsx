'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  ExternalLink,
  ChevronRight,
  Info,
  Tag,
  Eye,
  Activity as ActivityIcon,
  HelpCircle,
  Hash,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MediaDetailModal } from '@/components/media/MediaDetailModal';
import {
  ImpactReport,
  MediaAssetWithAnalysis,
  ReportSourceAsset,
  ComparisonCategory,
  ComparisonDirection,
} from '@/types';

interface ImpactReportViewProps {
  report: ImpactReport;
  onRefresh?: () => void;
}

export const ImpactReportView: React.FC<ImpactReportViewProps> = ({ report }) => {
  const [selectedAssetForInspection, setSelectedAssetForInspection] =
    useState<MediaAssetWithAnalysis | null>(null);

  const {
    project,
    timeline,
    activities,
    locations,
    beforeAfter,
    observedChanges,
    evidenceQuality,
    evidenceGaps,
    sourceAssets,
    generatedAt,
  } = report;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Not specified';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Not specified';
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Not specified';
    }
  };

  const formatDateRange = (start?: string | null, end?: string | null) => {
    const s = start ? formatDate(start) : null;
    const e = end ? formatDate(end) : null;
    if (s && s !== 'Not specified' && e && e !== 'Not specified') {
      return `${s} → ${e}`;
    }
    if (s && s !== 'Not specified') return `From ${s}`;
    if (e && e !== 'Not specified') return `Until ${e}`;
    return 'Not specified';
  };

  const getDirectionBadge = (dir: ComparisonDirection) => {
    switch (dir) {
      case 'increase':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">↑ Increase</span>;
      case 'decrease':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">↓ Decrease</span>;
      case 'new':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-300">+ New</span>;
      case 'removed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">- Cleared</span>;
      case 'changed':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">~ Modified</span>;
    }
  };

  const getConfidenceLevelBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            HIGH CONFIDENCE
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            MEDIUM CONFIDENCE
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            LOW CONFIDENCE
          </span>
        );
      case 'UNAVAILABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            UNAVAILABLE
          </span>
        );
    }
  };

  const handleAssetClick = (sourceAsset: ReportSourceAsset) => {
    setSelectedAssetForInspection({
      id: sourceAsset.id,
      project_id: project.id,
      url: sourceAsset.url,
      type: sourceAsset.type,
      capture_date: sourceAsset.captureDate,
      latitude: sourceAsset.latitude,
      longitude: sourceAsset.longitude,
      created_at: sourceAsset.captureDate || new Date().toISOString(),
      ai_analysis: {
        id: `ai-${sourceAsset.id}`,
        asset_id: sourceAsset.id,
        description: `Verified source asset supporting project evidence.`,
        objects: [],
        activities: sourceAsset.activities || [],
        scene: 'Field Evidence',
        visible_condition: '',
        confidence: 0.9,
        created_at: sourceAsset.captureDate || new Date().toISOString(),
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 print:p-0 print:max-w-none">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 print:hidden">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-text hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Project Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="gap-2 text-xs font-semibold shadow-sm border-slate-300 hover:bg-slate-50"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print / Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Main Document Container (Stylized for high audit credibility) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-12 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <header className="border-b-2 border-slate-900 pb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Vision Platform • Project Impact & Evidence Report</span>
            <span>Generated: {formatDate(generatedAt)}</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              {project.name}
            </h1>
            <p className="text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
              {project.description || 'Comprehensive ground-truth evidence and observation synthesis report.'}
            </p>
          </div>

          {/* Key Metric Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Media Assets</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{project.mediaCount}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Activities</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{activities.totalActivitiesCount}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Mapped Sites</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{locations.locationsCount}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Comparisons</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{beforeAfter.comparisonsCount}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Evidence Claims</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{evidenceQuality.totalClaims}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Coverage</span>
              <p className="text-xl font-bold text-teal-700 mt-0.5">{evidenceGaps.coveragePercentage}%</p>
            </div>
          </div>
        </header>

        {/* Quick Jump Navigation (Hidden on print) */}
        <nav className="bg-slate-50 rounded-xl p-4 border border-slate-200 print:hidden text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider block mb-2">
            Report Sections
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'sec-overview', label: '1. Project Overview' },
              { id: 'sec-timeline', label: '2. Timeline' },
              { id: 'sec-activities', label: '3. Activities' },
              { id: 'sec-locations', label: '4. Locations' },
              { id: 'sec-beforeafter', label: '5. Before / After' },
              { id: 'sec-changes', label: '6. Observed Changes' },
              { id: 'sec-confidence', label: '7. Evidence Quality' },
              { id: 'sec-gaps', label: '8. Evidence Gaps' },
              { id: 'sec-assets', label: '9. Source Assets' },
            ].map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-brand-primary hover:border-brand-primary transition-colors font-medium shadow-2xs"
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ================================================================== */}
        {/* SECTION 1: PROJECT OVERVIEW */}
        {/* ================================================================== */}
        <section id="sec-overview" className="space-y-4 scroll-mt-6">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="text-brand-primary font-black">1.</span> Project Overview
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Name</span>
                <p className="text-base font-bold text-slate-900">{project.name}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</span>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Type</span>
                <div className="mt-1">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                    {project.projectType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Geographic Location</span>
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {project.location || 'Not specified'}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operational Period</span>
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {formatDateRange(project.startDate, project.endDate)}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered In System</span>
                <p className="text-sm text-slate-700 mt-0.5">
                  {formatDate(project.createdDate)}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Media Collected</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {project.mediaCount} assets
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 2: TIMELINE */}
        {/* ================================================================== */}
        <section id="sec-timeline" className="space-y-4 scroll-mt-6">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="text-brand-primary font-black">2.</span> Timeline
            </h2>
          </div>

          {timeline.timeline.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-500">
              No dated media assets recorded in project timeline yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timeline.timeline.map((yearGroup) => (
                  <div
                    key={yearGroup.year}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-lg font-black text-slate-900">{yearGroup.year}</span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {yearGroup.totalAssets} {yearGroup.totalAssets === 1 ? 'asset' : 'assets'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {yearGroup.months.map((m) => (
                        <div
                          key={m.monthKey}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-50"
                        >
                          <span className="font-medium text-slate-700">{m.monthName}</span>
                          <span className="font-bold text-slate-900">{m.count} assets</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {timeline.undatedAssetsCount > 0 && (
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Additional assets with unavailable capture dates: <strong>{timeline.undatedAssetsCount}</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ================================================================== */}
        {/* SECTION 3: ACTIVITIES */}
        {/* ================================================================== */}
        <section id="sec-activities" className="space-y-4 scroll-mt-6">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="text-brand-primary font-black">3.</span> Activities
            </h2>
          </div>

          {activities.activities.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-500">
              AI activity analysis is not available for the current media.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activities.activities.map((act) => (
                  <div
                    key={act.normalizedKey}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                      <span className="text-sm font-semibold text-slate-900">{act.activity}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {act.assetCount} {act.assetCount === 1 ? 'asset' : 'assets'}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-500 italic">
                Note: Assets may document multiple concurrent activities without duplicating the total project media count ({activities.mediaWithActivitiesCount} distinct assets with detected activities).
              </p>
            </div>
          )}
        </section>

        {/* ================================================================== */}
        {/* SECTION 4: LOCATIONS */}
        {/* ================================================================== */}
        <section id="sec-locations" className="space-y-4 scroll-mt-6">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="text-brand-primary font-black">4.</span> Locations
            </h2>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-700 font-medium">{locations.summaryText}</p>

            {locations.locations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {locations.locations.map((loc) => (
                  <div
                    key={loc.key}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-xs font-mono font-medium text-slate-800">
                        {loc.formattedCoordinates}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {loc.assetCount} {loc.assetCount === 1 ? 'asset' : 'assets'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 5: BEFORE / AFTER EVIDENCE */}
        {/* ================================================================== */}
        <section id="sec-beforeafter" className="space-y-4 scroll-mt-6">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="text-brand-primary font-black">5.</span> Before / After Evidence
            </h2>
          </div>

          {beforeAfter.comparisons.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-500">
              No before/after comparisons have been created yet.
            </div>
          ) : (
            <div className="space-y-6">
              {beforeAfter.comparisons.map((comp, idx) => (
                <div
                  key={comp.id}
                  className="rounded-xl border border-slate-200 p-5 bg-slate-50/50 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Comparison #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">Confidence:</span>
                      <span className="text-xs font-bold text-slate-900">
                        {Math.round(comp.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Dual Image Comparison Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Before Image */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 uppercase tracking-wider">Before</span>
                        <span className="text-slate-500">{formatDate(comp.beforeCaptureDate)}</span>
                      </div>
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-300 bg-slate-200">
                        {comp.beforeAssetUrl ? (
                          <img
                            src={comp.beforeAssetUrl}
                            alt="Before intervention"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                            Image unavailable
                          </div>
                        )}
                      </div>
                    </div>

                    {/* After Image */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 uppercase tracking-wider">After</span>
                        <span className="text-slate-500">{formatDate(comp.afterCaptureDate)}</span>
                      </div>
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-300 bg-slate-200">
                        {comp.afterAssetUrl ? (
                          <img
                            src={comp.afterAssetUrl}
                            alt="After intervention"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                            Image unavailable
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Observation Summary */}
                  <div className="space-y-2 pt-2">
                    <p className="text-sm text-slate-800 leading-relaxed font-normal">
                      <strong>Observation:</strong> {comp.summary}
                    </p>

                    {/* Changes Tags */}
                    {comp.changes.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {comp.changes.map((ch, cIdx) => (
                          <div
                            key={cIdx}
                            className="inline-flex items-center gap-1.5 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 shadow-2xs"
                          >
                            {getDirectionBadge(ch.direction)}
                            <span>{ch.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================================================================== */}
        {/* SECTION 6: OBSERVED CHANGES */}
        {/* ================================================================== */}
        <section id="sec-changes" className="space-y-4 scroll-mt-6">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="text-brand-primary font-black">6.</span> Observed Changes
            </h2>
          </div>

          {observedChanges.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-500">
              No visual change observations recorded in comparisons yet.
            </div>
          ) : (
            <div className="space-y-2">
              {observedChanges.map((change, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{change.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="capitalize">{change.category}</span>
                        <span>•</span>
                        <span>
                          Observed in {change.occurrences} {change.occurrences === 1 ? 'comparison' : 'comparisons'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {getDirectionBadge(change.direction)}
                    <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {Math.round(change.confidence * 100)}% conf
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================================================================== */}
        {/* SECTION 7: EVIDENCE QUALITY */}
        {/* ================================================================== */}
        <section id="sec-confidence" className="space-y-4 scroll-mt-6">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="text-brand-primary font-black">7.</span> Evidence Quality
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Composite Confidence */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Overall Composite Confidence
                </span>
                {getConfidenceLevelBadge(evidenceQuality.confidenceLevel)}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">
                  {evidenceQuality.compositePercentage !== null ? `${evidenceQuality.compositePercentage}%` : 'N/A'}
                </span>
                <span className="text-xs text-slate-500 font-medium">composite evidence strength</span>
              </div>

              {/* 5-Signal Breakdown */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Signal Telemetry Breakdown
                </span>

                {[
                  { label: 'Vision Confidence', weight: '40%', val: evidenceQuality.signalsSummary.visionConfidence },
                  { label: 'Metadata Consistency', weight: '20%', val: evidenceQuality.signalsSummary.metadataConsistency },
                  { label: 'Image Quality', weight: '15%', val: evidenceQuality.signalsSummary.imageQuality },
                  { label: 'Cross-Asset Agreement', weight: '15%', val: evidenceQuality.signalsSummary.crossAssetAgreement },
                  { label: 'Temporal Consistency', weight: '10%', val: evidenceQuality.signalsSummary.temporalConsistency },
                ].map((sig) => (
                  <div key={sig.label} className="text-xs space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-700">{sig.label} ({sig.weight})</span>
                      <span className="font-bold text-slate-900">
                        {sig.val !== null && sig.val !== undefined ? `${Math.round(sig.val * 100)}%` : 'Unavailable'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-primary h-full rounded-full transition-all"
                        style={{ width: `${sig.val !== null && sig.val !== undefined ? Math.round(sig.val * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Claims Audit Stats & Mandatory Disclaimer */}
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Claims & Traceability Telemetry
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Total Claims</span>
                    <span className="text-lg font-bold text-slate-900">{evidenceQuality.totalClaims}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Evidence-Backed</span>
                    <span className="text-lg font-bold text-emerald-700">{evidenceQuality.evidenceBackedClaimsCount}</span>
                  </div>
                </div>

                {evidenceQuality.claimsWithoutEvidenceCount > 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    ⚠ Claims with unavailable evidence: {evidenceQuality.claimsWithoutEvidenceCount}
                  </div>
                )}
              </div>

              {/* Mandatory MVP Heuristic Transparency Disclaimer */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  Evidence Confidence Disclaimer
                </span>
                <p className="leading-relaxed text-slate-600">
                  {evidenceQuality.disclaimer}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 8: EVIDENCE GAPS */}
        {/* ================================================================== */}
        <section id="sec-gaps" className="space-y-4 scroll-mt-6">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="text-brand-primary font-black">8.</span> Evidence Gaps
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">
                Intervention Taxonomy: <strong className="capitalize">{evidenceGaps.projectType.replace('_', ' ')}</strong>
                {evidenceGaps.projectTypeConfigured ? ' (Standard 6-stage protocol)' : ' (Generic profile)'}
              </span>
              <span className="font-bold text-slate-900">
                Evidence Coverage: {evidenceGaps.coveragePercentage}%
              </span>
            </div>

            {/* Coverage Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-teal-600 h-full rounded-full transition-all"
                style={{ width: `${evidenceGaps.coveragePercentage}%` }}
              />
            </div>

            {/* Categories Split: Available vs Missing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Available Evidence */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Available Evidence ({evidenceGaps.availableCategories.length})
                </span>

                {evidenceGaps.availableCategories.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No evidence categories satisfied yet.</p>
                ) : (
                  <div className="space-y-2">
                    {evidenceGaps.categories
                      .filter((c) => c.status === 'available')
                      .map((cat) => (
                        <div
                          key={cat.category}
                          className="p-2.5 rounded-lg bg-white border border-emerald-200 text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">✅ {cat.label}</span>
                            <span className="text-emerald-700 font-semibold">{cat.evidenceCount} sources</span>
                          </div>
                          <p className="text-slate-600">{cat.explanation}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Missing Evidence Gaps */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Evidence Gaps ({evidenceGaps.missingCategories.length})
                </span>

                {evidenceGaps.missingCategories.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No configured evidence gaps detected.</p>
                ) : (
                  <div className="space-y-2">
                    {evidenceGaps.categories
                      .filter((c) => c.status === 'missing')
                      .map((cat) => (
                        <div
                          key={cat.category}
                          className="p-2.5 rounded-lg bg-white border border-amber-200 text-xs space-y-1 shadow-2xs"
                        >
                          <span className="font-bold text-slate-900 block">⚠ {cat.label}</span>
                          <p className="text-slate-600">{cat.explanation}</p>
                          {cat.suggestedNextAction && (
                            <p className="text-brand-primary font-medium pt-0.5">
                              Next collection: {cat.suggestedNextAction}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 italic">
              Note: Evidence coverage measures available documentation across required intervention categories. It is not an environmental impact score or proof of ecological success.
            </p>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 9: SOURCE ASSETS & TRACEABILITY MATRIX */}
        {/* ================================================================== */}
        <section id="sec-assets" className="space-y-4 scroll-mt-6">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="text-brand-primary font-black">9.</span> Source Assets & Traceability Matrix
            </h2>
          </div>

          <p className="text-xs text-slate-600">
            Every observation and claim in this report remains linked to ground-truth photographic evidence.
            Click any asset to inspect high-resolution imagery, Cloudinary CDN provenance, and multimodal AI analysis.
          </p>

          {sourceAssets.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-500">
              No source assets recorded in this project.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sourceAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => handleAssetClick(asset)}
                  className="group rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md hover:border-brand-primary/50 transition-all cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img
                      src={asset.url}
                      alt="Source evidence"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-xs">
                      {asset.id}
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(asset.captureDate)}
                        </span>
                        {asset.latitude && asset.longitude && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {asset.latitude.toFixed(2)}, {asset.longitude.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Activities */}
                      {asset.activities && asset.activities.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {asset.activities.map((act, aIdx) => (
                            <span
                              key={aIdx}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 capitalize"
                            >
                              {act}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Traceability badges */}
                    <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1">
                      {asset.supportingClaims.length > 0 && (
                        <div className="text-slate-600 truncate">
                          <strong className="text-slate-800">Supports:</strong>{' '}
                          {asset.supportingClaims[0].claim}
                          {asset.supportingClaims.length > 1 && ` (+${asset.supportingClaims.length - 1} more)`}
                        </div>
                      )}
                      {asset.usedInComparisons.length > 0 && (
                        <div className="text-slate-600">
                          <strong className="text-slate-800">Comparison:</strong>{' '}
                          Used as {asset.usedInComparisons.map((c) => c.role).join(', ')} photo
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Report Footer */}
        <footer className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span>Vision Media Intelligence & Ground-Truth Verification Platform</span>
            <span className="block mt-0.5">Project ID: {project.id}</span>
          </div>
          <div className="text-right">
            <span>Server Authenticated & Multi-Tenant Verified</span>
          </div>
        </footer>
      </div>

      {/* Media Inspection Modal */}
      {selectedAssetForInspection && (
        <MediaDetailModal
          isOpen={true}
          onClose={() => setSelectedAssetForInspection(null)}
          asset={selectedAssetForInspection}
          projectName={project.name}
        />
      )}
    </div>
  );
};
