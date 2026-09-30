import { ProjectService } from './project.service.js';
import { AssetService } from './asset.service.js';
import { AiAnalysisRepository } from '../repositories/ai-analysis.repository.js';
import { ComparisonService } from './comparison.service.js';
import { ClaimService } from './claim.service.js';
import { EvidenceGapService } from './evidence-gap.service.js';
import { ConfidenceService, CONFIDENCE_DISCLAIMER } from './confidence.service.js';
import {
  ImpactReport,
  ReportProjectOverview,
  ReportTimelineSection,
  ReportTimelineYear,
  ReportTimelineMonth,
  ReportActivitySection,
  ReportActivityItem,
  ReportLocationSection,
  ReportLocationCluster,
  ReportBeforeAfterSection,
  ReportComparisonItem,
  ReportObservedChange,
  ReportEvidenceQualitySection,
  ReportEvidenceGapsSection,
  ReportSourceAsset,
  ComparisonCategory,
  ComparisonDirection,
} from '../types/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
}

export class ImpactReportService {
  private projectService: ProjectService;
  private assetService: AssetService;
  private aiAnalysisRepo: AiAnalysisRepository;
  private comparisonService: ComparisonService;
  private claimService: ClaimService;
  private evidenceGapService: EvidenceGapService;
  private confidenceService: ConfidenceService;

  constructor() {
    this.projectService = new ProjectService();
    this.assetService = new AssetService();
    this.aiAnalysisRepo = new AiAnalysisRepository();
    this.comparisonService = new ComparisonService();
    this.claimService = new ClaimService();
    this.evidenceGapService = new EvidenceGapService();
    this.confidenceService = new ConfidenceService();
  }

  /**
   * Generates a comprehensive project impact and evidence report
   * composed dynamically from normalized Phase 2-8 data.
   *
   * Enforces server-side project authorization to prevent cross-tenant IDOR access.
   */
  async generateProjectReport(projectId: string, userId?: string): Promise<ImpactReport> {
    if (!projectId || !projectId.trim()) {
      throw new ValidationError('Project ID is required');
    }

    // 1. Authorize: guarantees project exists and authenticated user has access
    const project = await this.projectService.getProjectById(projectId, userId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} not found`);
    }

    // 2. Concurrently fetch all project-scoped data
    const [assets, comparisons, claimsResult, evidenceGaps, confidenceReport] = await Promise.all([
      this.assetService.getAssetsByProject(projectId),
      this.comparisonService.getComparisonsByProject(projectId, userId),
      this.claimService.getClaims(projectId, undefined, userId),
      this.evidenceGapService.detectEvidenceGaps(projectId, userId),
      this.claimService.getProjectConfidenceReport(projectId, userId),
    ]);

    const assetIds = assets.map((a) => a.id);
    const analysesMap = await this.aiAnalysisRepo.findLatestByAssetIds(assetIds);

    // ========================================================================
    // Section 1: Project Overview
    // ========================================================================
    const overview: ReportProjectOverview = {
      id: project.id,
      name: project.name || 'Untitled Project',
      description: project.description?.trim() ? project.description : null,
      location: project.location?.trim() ? project.location : null,
      startDate: project.start_date || null,
      endDate: project.end_date || null,
      projectType: project.project_type || 'other',
      createdDate: project.created_at,
      mediaCount: assets.length,
    };

    // ========================================================================
    // Section 2: Timeline
    // ========================================================================
    const timelineMap = new Map<string, Map<number, number>>();
    let undatedCount = 0;

    for (const asset of assets) {
      let dateObj: Date | null = null;
      if (asset.capture_date) {
        const d = new Date(asset.capture_date);
        if (!isNaN(d.getTime())) dateObj = d;
      }
      if (!dateObj && asset.created_at) {
        const d = new Date(asset.created_at);
        if (!isNaN(d.getTime())) dateObj = d;
      }

      if (!dateObj) {
        undatedCount++;
        continue;
      }

      const yearStr = dateObj.getFullYear().toString();
      const monthIdx = dateObj.getMonth();

      if (!timelineMap.has(yearStr)) {
        timelineMap.set(yearStr, new Map());
      }
      const yearMonths = timelineMap.get(yearStr)!;
      yearMonths.set(monthIdx, (yearMonths.get(monthIdx) || 0) + 1);
    }

    const timelineYears: ReportTimelineYear[] = Array.from(timelineMap.entries())
      .map(([yearStr, monthsMap]) => {
        let yearTotal = 0;
        const months: ReportTimelineMonth[] = Array.from(monthsMap.entries())
          .map(([mIdx, count]) => {
            yearTotal += count;
            return {
              monthName: MONTH_NAMES[mIdx],
              monthKey: `${yearStr}-${String(mIdx + 1).padStart(2, '0')}`,
              count,
            };
          })
          // Sort months newest first (December to January)
          .sort((a, b) => {
            const idxA = MONTH_NAMES.indexOf(a.monthName);
            const idxB = MONTH_NAMES.indexOf(b.monthName);
            return idxB - idxA;
          });

        return {
          year: yearStr,
          totalAssets: yearTotal,
          months,
        };
      })
      // Sort years newest first
      .sort((a, b) => Number(b.year) - Number(a.year));

    const timelineSection: ReportTimelineSection = {
      timeline: timelineYears,
      undatedAssetsCount: undatedCount,
      totalDatedAssets: assets.length - undatedCount,
    };

    // ========================================================================
    // Section 3: Activities
    // ========================================================================
    const activityMap = new Map<string, { label: string; assetIds: Set<string> }>();

    for (const asset of assets) {
      const analysis = analysesMap.get(asset.id);
      const rawActivities = analysis?.activities;
      if (Array.isArray(rawActivities)) {
        for (const item of rawActivities) {
          if (typeof item !== 'string') continue;
          const trimmed = item.trim();
          if (!trimmed) continue;

          const normalizedKey = trimmed.toLowerCase();
          const existing = activityMap.get(normalizedKey);
          if (existing) {
            existing.assetIds.add(asset.id);
          } else {
            activityMap.set(normalizedKey, {
              label: toTitleCase(trimmed),
              assetIds: new Set([asset.id]),
            });
          }
        }
      }
    }

    const activitiesList: ReportActivityItem[] = Array.from(activityMap.entries())
      .map(([key, val]) => ({
        activity: val.label,
        normalizedKey: key,
        assetCount: val.assetIds.size,
      }))
      .sort((a, b) => b.assetCount - a.assetCount || a.activity.localeCompare(b.activity));

    // Calculate distinct assets that have at least one activity
    const mediaWithActivitiesSet = new Set<string>();
    for (const val of activityMap.values()) {
      for (const id of val.assetIds) {
        mediaWithActivitiesSet.add(id);
      }
    }

    const activitiesSection: ReportActivitySection = {
      activities: activitiesList,
      totalActivitiesCount: activitiesList.length,
      mediaWithActivitiesCount: mediaWithActivitiesSet.size,
    };

    // ========================================================================
    // Section 4: Locations
    // ========================================================================
    const locationMap = new Map<
      string,
      { lat: number; lng: number; count: number; sampleUrl?: string }
    >();

    for (const asset of assets) {
      const lat = Number(asset.latitude);
      const lng = Number(asset.longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        continue;
      }

      const roundedLat = Number(lat.toFixed(3));
      const roundedLng = Number(lng.toFixed(3));
      const key = `${roundedLat.toFixed(3)},${roundedLng.toFixed(3)}`;

      const existing = locationMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        locationMap.set(key, {
          lat: roundedLat,
          lng: roundedLng,
          count: 1,
          sampleUrl: asset.url,
        });
      }
    }

    const locationsList: ReportLocationCluster[] = Array.from(locationMap.entries()).map(
      ([key, val]) => ({
        key,
        latitude: val.lat,
        longitude: val.lng,
        formattedCoordinates: `${val.lat >= 0 ? `${val.lat}° N` : `${Math.abs(val.lat)}° S`}, ${
          val.lng >= 0 ? `${val.lng}° E` : `${Math.abs(val.lng)}° W`
        }`,
        assetCount: val.count,
        sampleAssetUrl: val.sampleUrl,
      })
    );

    const locationsSection: ReportLocationSection = {
      locationsCount: locationsList.length,
      locations: locationsList,
      summaryText:
        locationsList.length > 0
          ? `${locationsList.length} ${
              locationsList.length === 1 ? 'operational site' : 'operational sites'
            } mapped in project media`
          : 'No GPS coordinates recorded in project media',
    };

    // ========================================================================
    // Section 5: Before / After Evidence
    // ========================================================================
    const comparisonItems: ReportComparisonItem[] = comparisons.map((comp) => ({
      id: comp.id,
      beforeAssetId: comp.before_asset_id,
      afterAssetId: comp.after_asset_id,
      beforeAssetUrl: comp.before_asset?.url || '',
      afterAssetUrl: comp.after_asset?.url || '',
      beforeCaptureDate: comp.before_asset?.capture_date || null,
      afterCaptureDate: comp.after_asset?.capture_date || null,
      summary: comp.comparison_result?.summary || 'Visual comparison completed.',
      confidence: comp.confidence,
      compositeConfidence: comp.compositeConfidence,
      changes: comp.comparison_result?.changes || [],
    }));

    const beforeAfterSection: ReportBeforeAfterSection = {
      comparisonsCount: comparisonItems.length,
      comparisons: comparisonItems,
    };

    // ========================================================================
    // Section 6: Observed Changes (Aggregated from Phase 5 Comparisons)
    // ========================================================================
    // Group changes by normalized description to show occurrence counts
    // while strictly preserving original evidence wording
    const changesMap = new Map<
      string,
      {
        description: string;
        category: ComparisonCategory;
        direction: ComparisonDirection;
        confidenceSum: number;
        occurrences: number;
        comparisonIds: Set<string>;
      }
    >();

    for (const comp of comparisons) {
      const changes = comp.comparison_result?.changes || [];
      for (const ch of changes) {
        const desc = (ch.description || '').trim();
        if (!desc) continue;
        const normalized = desc.toLowerCase();

        const existing = changesMap.get(normalized);
        if (existing) {
          existing.occurrences += 1;
          existing.confidenceSum += Number(ch.confidence || comp.confidence) || 0.85;
          existing.comparisonIds.add(comp.id);
        } else {
          changesMap.set(normalized, {
            description: desc,
            category: ch.category,
            direction: ch.direction,
            confidenceSum: Number(ch.confidence || comp.confidence) || 0.85,
            occurrences: 1,
            comparisonIds: new Set([comp.id]),
          });
        }
      }
    }

    const observedChangesList: ReportObservedChange[] = Array.from(changesMap.entries()).map(
      ([_key, val]) => ({
        description: val.description,
        category: val.category,
        direction: val.direction,
        confidence: Number((val.confidenceSum / val.occurrences).toFixed(2)),
        comparisonId: Array.from(val.comparisonIds)[0],
        occurrences: val.occurrences,
        supportingComparisonIds: Array.from(val.comparisonIds),
      })
    );

    // ========================================================================
    // Section 7: Evidence Quality (Phase 8 Composite Confidence & Telemetry)
    // ========================================================================
    const claims = claimsResult.claims;
    const telemetry = claimsResult.telemetry;

    const evidenceQualitySection: ReportEvidenceQualitySection = {
      compositeConfidence: confidenceReport.averageCompositeConfidence,
      compositePercentage: confidenceReport.averageCompositePercentage,
      confidenceLevel: confidenceReport.level,
      signalsSummary: confidenceReport.signalsSummary,
      totalClaims: telemetry.totalClaims,
      evidenceBackedClaimsCount: telemetry.evidenceBackedClaims,
      claimsWithoutEvidenceCount: Math.max(0, telemetry.totalClaims - telemetry.evidenceBackedClaims),
      disclaimer: confidenceReport.disclaimer || CONFIDENCE_DISCLAIMER,
    };

    // ========================================================================
    // Section 8: Evidence Gaps (Phase 7 Rule-Based Taxonomy)
    // ========================================================================
    const evidenceGapsSection: ReportEvidenceGapsSection = {
      projectType: evidenceGaps.projectType,
      projectTypeConfigured: evidenceGaps.projectTypeConfigured,
      expectedCategories: evidenceGaps.expected,
      availableCategories: evidenceGaps.available,
      missingCategories: evidenceGaps.missing,
      coveragePercentage: evidenceGaps.coverage?.percentage || 0,
      categories: evidenceGaps.categories,
    };

    // ========================================================================
    // Section 9: Source Assets (Traceability Matrix)
    // ========================================================================
    // Map each project asset to the exact claims and comparisons it supports
    const sourceAssetsList: ReportSourceAsset[] = assets.map((asset) => {
      // 1. Supporting claims
      const supportingClaims = claims
        .filter((c) => c.evidence?.some((e) => e.assetId === asset.id))
        .map((c) => ({
          id: c.id,
          claim: c.claim,
          confidence: c.confidence,
        }));

      // 2. Used in comparisons
      const usedInComparisons: { id: string; role: 'before' | 'after' }[] = [];
      for (const comp of comparisons) {
        if (comp.before_asset_id === asset.id) {
          usedInComparisons.push({ id: comp.id, role: 'before' });
        }
        if (comp.after_asset_id === asset.id) {
          usedInComparisons.push({ id: comp.id, role: 'after' });
        }
      }

      // 3. Identified activities
      const analysis = analysesMap.get(asset.id);
      const acts = Array.isArray(analysis?.activities) ? analysis.activities : [];

      return {
        id: asset.id,
        url: asset.url,
        type: asset.type || 'image',
        captureDate: asset.capture_date || asset.created_at || null,
        latitude: asset.latitude ? Number(asset.latitude) : null,
        longitude: asset.longitude ? Number(asset.longitude) : null,
        activities: acts,
        supportingClaims,
        usedInComparisons,
      };
    });

    return {
      project: overview,
      timeline: timelineSection,
      activities: activitiesSection,
      locations: locationsSection,
      beforeAfter: beforeAfterSection,
      observedChanges: observedChangesList,
      evidenceQuality: evidenceQualitySection,
      evidenceGaps: evidenceGapsSection,
      sourceAssets: sourceAssetsList,
      generatedAt: new Date().toISOString(),
    };
  }
}
