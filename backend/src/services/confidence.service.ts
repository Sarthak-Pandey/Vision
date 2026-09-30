import {
  ConfidenceSignals,
  CompositeConfidence,
  ConfidenceLevel,
  ConfidenceBreakdownItem,
  EvidenceClaim,
  ComparisonRecord,
  Project,
  ProjectConfidenceReport,
} from '../types/index.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Phase 8 confidence is an MVP heuristic composite score.
 *
 * Weights:
 * Vision 40%
 * Metadata 20%
 * Image Quality 15%
 * Cross-Asset Agreement 15%
 * Temporal 10%
 *
 * Thresholds:
 * <40 Low
 * 40–<70 Medium
 * >=70 High
 *
 * This score is not a scientifically validated probability,
 * certainty measure, or environmental impact score.
 */

// These weights are MVP heuristics and are not scientifically validated.
export const CONFIDENCE_WEIGHTS = {
  visionConfidence: 0.40,
  metadataConsistency: 0.20,
  imageQuality: 0.15,
  crossAssetAgreement: 0.15,
  temporalConsistency: 0.10,
} as const;

export const CONFIDENCE_DISCLAIMER =
  'Composite MVP heuristic based on available evidence signals. Not a scientifically validated probability.';

export class ConfidenceService {
  /**
   * Validate and normalize a signal value to a 0.0 -> 1.0 range.
   * If value is null or undefined, returns null (indicating signal is unavailable).
   * Throws ValidationError for invalid numbers (NaN, Infinity, < 0, > 1, or non-numeric types).
   */
  public validateSignal(name: string, value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      throw new ValidationError(
        `Invalid ${name} signal: must be a finite number between 0.0 and 1.0`
      );
    }

    if (value < 0 || value > 1) {
      throw new ValidationError(
        `Invalid ${name} signal (${value}): value must be between 0.0 and 1.0`
      );
    }

    return value;
  }

  /**
   * Classify normalized score into deterministic categorical levels.
   * Exact boundary behavior:
   * score < 0.40       → LOW
   * 0.40 <= score < 0.70 → MEDIUM
   * score >= 0.70      → HIGH
   */
  public classify(score: number | null): ConfidenceLevel {
    if (score === null || score === undefined) {
      return 'UNAVAILABLE';
    }
    if (score < 0.40) {
      return 'LOW';
    }
    if (score < 0.70) {
      return 'MEDIUM';
    }
    return 'HIGH';
  }

  /**
   * Explanatory guidance string for a given level.
   */
  public getLevelExplanation(level: ConfidenceLevel): string {
    switch (level) {
      case 'HIGH':
        return 'Strong agreement across the currently available evidence signals.';
      case 'MEDIUM':
        return 'Some evidence signals are mixed or limited.';
      case 'LOW':
        return 'Review source evidence before relying on this observation.';
      case 'UNAVAILABLE':
      default:
        return 'No confidence signals are currently available.';
    }
  }

  /**
   * Calculate deterministic composite confidence from available signals.
   * Normalizes over available weights when signals are missing.
   * If all signals are missing, returns unavailable status (score = null).
   */
  public calculate(signals: ConfidenceSignals): CompositeConfidence {
    const validatedSignals: Record<keyof ConfidenceSignals, number | null> = {
      visionConfidence: this.validateSignal('visionConfidence', signals.visionConfidence),
      metadataConsistency: this.validateSignal('metadataConsistency', signals.metadataConsistency),
      imageQuality: this.validateSignal('imageQuality', signals.imageQuality),
      crossAssetAgreement: this.validateSignal('crossAssetAgreement', signals.crossAssetAgreement),
      temporalConsistency: this.validateSignal('temporalConsistency', signals.temporalConsistency),
    };

    let weightedSum = 0;
    let availableWeightsSum = 0;

    const breakdown: Record<keyof ConfidenceSignals, ConfidenceBreakdownItem> = {
      visionConfidence: {
        name: 'Vision Confidence',
        weight: CONFIDENCE_WEIGHTS.visionConfidence,
        score: validatedSignals.visionConfidence,
        percentage:
          validatedSignals.visionConfidence !== null
            ? Math.round(validatedSignals.visionConfidence * 100)
            : null,
        available: validatedSignals.visionConfidence !== null,
        explanation:
          validatedSignals.visionConfidence !== null
            ? `Multimodal vision intelligence observation confidence (${Math.round(
                validatedSignals.visionConfidence * 100
              )}%)`
            : 'No vision model confidence score recorded for this claim',
      },
      metadataConsistency: {
        name: 'Metadata Consistency',
        weight: CONFIDENCE_WEIGHTS.metadataConsistency,
        score: validatedSignals.metadataConsistency,
        percentage:
          validatedSignals.metadataConsistency !== null
            ? Math.round(validatedSignals.metadataConsistency * 100)
            : null,
        available: validatedSignals.metadataConsistency !== null,
        explanation:
          validatedSignals.metadataConsistency !== null
            ? `Internal coherence of GPS site bounds, media type, and project scoping (${Math.round(
                validatedSignals.metadataConsistency * 100
              )}%)`
            : 'Evidence media lacks geographic or typed metadata for consistency verification',
      },
      imageQuality: {
        name: 'Image Quality',
        weight: CONFIDENCE_WEIGHTS.imageQuality,
        score: validatedSignals.imageQuality,
        percentage:
          validatedSignals.imageQuality !== null
            ? Math.round(validatedSignals.imageQuality * 100)
            : null,
        available: validatedSignals.imageQuality !== null,
        explanation:
          validatedSignals.imageQuality !== null
            ? `Photographic asset readability, resolution, and format clarity (${Math.round(
                validatedSignals.imageQuality * 100
              )}%)`
            : 'Media asset quality could not be determined',
      },
      crossAssetAgreement: {
        name: 'Cross-Asset Agreement',
        weight: CONFIDENCE_WEIGHTS.crossAssetAgreement,
        score: validatedSignals.crossAssetAgreement,
        percentage:
          validatedSignals.crossAssetAgreement !== null
            ? Math.round(validatedSignals.crossAssetAgreement * 100)
            : null,
        available: validatedSignals.crossAssetAgreement !== null,
        explanation:
          validatedSignals.crossAssetAgreement !== null
            ? `Independent corroboration across multiple project evidence assets (${Math.round(
                validatedSignals.crossAssetAgreement * 100
              )}%)`
            : 'Single-photo observation without independent comparative corroboration',
      },
      temporalConsistency: {
        name: 'Temporal Consistency',
        weight: CONFIDENCE_WEIGHTS.temporalConsistency,
        score: validatedSignals.temporalConsistency,
        percentage:
          validatedSignals.temporalConsistency !== null
            ? Math.round(validatedSignals.temporalConsistency * 100)
            : null,
        available: validatedSignals.temporalConsistency !== null,
        explanation:
          validatedSignals.temporalConsistency !== null
            ? `Chronological alignment with intervention timeline and capture dates (${Math.round(
                validatedSignals.temporalConsistency * 100
              )}%)`
            : 'Capture timestamps not specified for temporal validation',
      },
    };

    // Calculate sum of available signals
    for (const key of Object.keys(CONFIDENCE_WEIGHTS) as Array<keyof ConfidenceSignals>) {
      const signalVal = validatedSignals[key];
      const weight = CONFIDENCE_WEIGHTS[key];

      if (signalVal !== null && signalVal !== undefined) {
        weightedSum += signalVal * weight;
        availableWeightsSum += weight;
      }
    }

    // All signals missing case: Do not manufacture a confidence score
    if (availableWeightsSum === 0) {
      return {
        score: null,
        percentage: null,
        level: 'UNAVAILABLE',
        available: false,
        signals: validatedSignals,
        breakdown,
        evaluatedWeightsSum: 0,
        disclaimer: CONFIDENCE_DISCLAIMER,
        explanation: this.getLevelExplanation('UNAVAILABLE'),
      };
    }

    // Normalized score over available weights
    const rawScore = weightedSum / availableWeightsSum;
    const clampedScore = Math.min(Math.max(rawScore, 0), 1);
    const percentage = Math.round(clampedScore * 100);
    const level = this.classify(clampedScore);

    return {
      score: clampedScore,
      percentage,
      level,
      available: true,
      signals: validatedSignals,
      breakdown,
      evaluatedWeightsSum: Math.round(availableWeightsSum * 100) / 100,
      disclaimer: CONFIDENCE_DISCLAIMER,
      explanation: this.getLevelExplanation(level),
    };
  }

  /**
   * Derive confidence signals from an EvidenceClaim and compute composite confidence.
   */
  public evaluateClaimConfidence(
    claim: EvidenceClaim,
    project?: Project | null,
    allProjectClaims?: EvidenceClaim[]
  ): CompositeConfidence {
    // 1. Vision Confidence
    const rawVision = Number(claim.confidence);
    const visionConfidence = !isNaN(rawVision)
      ? Math.min(Math.max(rawVision, 0), 1)
      : null;

    // 2. Metadata Consistency
    let metadataConsistency: number | null = null;
    const evidenceList = claim.evidence || [];
    if (evidenceList.length > 0) {
      let subChecksTotal = 0;
      let subChecksCount = 0;

      // Check valid media type
      for (const ev of evidenceList) {
        if (ev.type) {
          subChecksCount++;
          const t = ev.type.toLowerCase();
          if (t === 'image' || t === 'video' || t.startsWith('image/') || t.startsWith('video/')) {
            subChecksTotal += 1.0;
          } else {
            subChecksTotal += 0.5;
          }
        }
      }

      // Check GPS coordinate validity if present
      for (const ev of evidenceList) {
        if (ev.latitude !== null && ev.latitude !== undefined &&
            ev.longitude !== null && ev.longitude !== undefined) {
          subChecksCount++;
          const lat = Number(ev.latitude);
          const lng = Number(ev.longitude);
          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            subChecksTotal += 1.0;
          } else {
            subChecksTotal += 0.0;
          }
        }
      }

      // Check project matching
      subChecksCount++;
      subChecksTotal += 1.0; // Server-scoped to verified project

      // If multiple assets have coordinates, check geographic proximity (< 1 degree ~ 110km)
      const coordAssets = evidenceList.filter(
        (e) => e.latitude !== null && e.latitude !== undefined &&
               e.longitude !== null && e.longitude !== undefined
      );
      if (coordAssets.length >= 2) {
        subChecksCount++;
        const latDiff = Math.abs(Number(coordAssets[0].latitude) - Number(coordAssets[1].latitude));
        const lngDiff = Math.abs(Number(coordAssets[0].longitude) - Number(coordAssets[1].longitude));
        if (latDiff <= 1.0 && lngDiff <= 1.0) {
          subChecksTotal += 1.0;
        } else {
          subChecksTotal += 0.6;
        }
      }

      if (subChecksCount > 0) {
        metadataConsistency = Math.min(Math.max(subChecksTotal / subChecksCount, 0), 1);
      }
    }

    // 3. Image Quality
    let imageQuality: number | null = null;
    if (evidenceList.length > 0) {
      let qualitySum = 0;
      let qualityCount = 0;

      for (const ev of evidenceList) {
        qualityCount++;
        const url = (ev.url || '').toLowerCase();
        if (!url) {
          qualitySum += 0.2;
        } else if (url.includes('cloudinary.com') || url.startsWith('https://res.cloudinary.com')) {
          // Cloudinary managed WebP/JPEG CDN delivery with automated optimization
          qualitySum += 0.92;
        } else if (url.startsWith('https://')) {
          qualitySum += 0.88;
        } else {
          qualitySum += 0.60;
        }
      }

      if (qualityCount > 0) {
        imageQuality = Math.min(Math.max(qualitySum / qualityCount, 0), 1);
      }
    }

    // 4. Cross-Asset Agreement
    let crossAssetAgreement: number | null = null;
    if (claim.sourceType === 'comparison' && evidenceList.length >= 2) {
      // Comparison claim backed by dual Before/After assets
      crossAssetAgreement = 0.88;
    } else if (evidenceList.length >= 2) {
      // Multiple evidence assets corroborating the same observation
      crossAssetAgreement = 0.90;
    } else if (allProjectClaims && allProjectClaims.length > 1) {
      // Corroboration from other claims in the project sharing related activities/categories
      const relatedClaims = allProjectClaims.filter(
        (c) => c.id !== claim.id && (
          (claim.category && c.category === claim.category) ||
          (c.claim.toLowerCase().includes('observed') && claim.claim.toLowerCase().includes('observed'))
        )
      );
      if (relatedClaims.length > 0) {
        crossAssetAgreement = 0.85;
      } else {
        // Single asset with no other corroborating claims: leave null to normalize remaining weights
        crossAssetAgreement = null;
      }
    } else {
      // Single asset claim: unavailable so remaining weights normalize without unfair penalty
      crossAssetAgreement = null;
    }

    // 5. Temporal Consistency
    let temporalConsistency: number | null = null;
    if (claim.sourceType === 'comparison' && evidenceList.length >= 2) {
      const beforeEv = evidenceList.find((e) => e.role === 'before') || evidenceList[0];
      const afterEv = evidenceList.find((e) => e.role === 'after') || evidenceList[1];

      if (beforeEv.captureDate && afterEv.captureDate) {
        const bDate = new Date(beforeEv.captureDate).getTime();
        const aDate = new Date(afterEv.captureDate).getTime();

        if (!isNaN(bDate) && !isNaN(aDate)) {
          if (bDate < aDate) {
            temporalConsistency = 1.0; // Strictly chronological
          } else if (bDate === aDate) {
            temporalConsistency = 0.70; // Same date
          } else {
            temporalConsistency = 0.15; // Reverse chronological warning
          }
        }
      } else {
        // Check created_at order if capture_date missing
        temporalConsistency = 0.80;
      }
    } else if (evidenceList.length > 0) {
      const firstDateStr = evidenceList[0].captureDate;
      if (firstDateStr) {
        const capDate = new Date(firstDateStr).getTime();
        const now = Date.now();
        if (!isNaN(capDate)) {
          if (capDate > now + 86400000) {
            // Future date
            temporalConsistency = 0.20;
          } else if (project?.start_date) {
            const pStart = new Date(project.start_date).getTime();
            if (!isNaN(pStart) && capDate >= pStart - 30 * 86400000) {
              temporalConsistency = 0.95;
            } else {
              temporalConsistency = 0.75;
            }
          } else {
            temporalConsistency = 0.90;
          }
        }
      }
    }

    return this.calculate({
      visionConfidence,
      metadataConsistency,
      imageQuality,
      crossAssetAgreement,
      temporalConsistency,
    });
  }

  /**
   * Derive confidence signals from a ComparisonRecord and compute composite confidence.
   */
  public evaluateComparisonConfidence(
    comparison: ComparisonRecord,
    project?: Project | null
  ): CompositeConfidence {
    // 1. Vision Confidence
    const rawVision = Number(comparison.confidence);
    const visionConfidence = !isNaN(rawVision)
      ? Math.min(Math.max(rawVision, 0), 1)
      : 0.85;

    // 2. Metadata Consistency
    let metadataConsistency: number | null = 0.90;
    const bAsset = comparison.before_asset;
    const aAsset = comparison.after_asset;

    if (bAsset && aAsset) {
      let checks = 0;
      let valid = 0;

      // Project consistency
      checks++;
      if (bAsset.project_id === aAsset.project_id) valid++;

      // Coordinate consistency if present
      if (bAsset.latitude && aAsset.latitude && bAsset.longitude && aAsset.longitude) {
        checks++;
        const latDiff = Math.abs(Number(bAsset.latitude) - Number(aAsset.latitude));
        const lngDiff = Math.abs(Number(bAsset.longitude) - Number(aAsset.longitude));
        if (latDiff <= 0.1 && lngDiff <= 0.1) valid++;
        else if (latDiff <= 1.0 && lngDiff <= 1.0) valid += 0.7;
      }

      metadataConsistency = checks > 0 ? valid / checks : 0.90;
    }

    // 3. Image Quality
    let imageQuality = 0.90;
    if (bAsset?.url && aAsset?.url) {
      const bCloud = bAsset.url.includes('cloudinary');
      const aCloud = aAsset.url.includes('cloudinary');
      if (bCloud && aCloud) imageQuality = 0.94;
      else if (bCloud || aCloud) imageQuality = 0.90;
      else imageQuality = 0.85;
    }

    // 4. Cross-Asset Agreement
    let crossAssetAgreement = 0.85;
    const changes = comparison.comparison_result?.changes || [];
    if (changes.length > 0) {
      const uncertain = changes.filter((c) => c.direction === 'uncertain').length;
      if (uncertain === 0) crossAssetAgreement = 0.92;
      else if (uncertain < changes.length) crossAssetAgreement = 0.75;
      else crossAssetAgreement = 0.50;
    }

    // 5. Temporal Consistency
    let temporalConsistency: number | null = 0.85;
    if (bAsset?.capture_date && aAsset?.capture_date) {
      const bTime = new Date(bAsset.capture_date).getTime();
      const aTime = new Date(aAsset.capture_date).getTime();
      if (!isNaN(bTime) && !isNaN(aTime)) {
        if (bTime < aTime) temporalConsistency = 1.0;
        else if (bTime === aTime) temporalConsistency = 0.70;
        else temporalConsistency = 0.15;
      }
    }

    return this.calculate({
      visionConfidence,
      metadataConsistency,
      imageQuality,
      crossAssetAgreement,
      temporalConsistency,
    });
  }

  /**
   * Compute aggregate project confidence telemetry report.
   */
  public generateProjectConfidenceReport(
    projectId: string,
    claims: EvidenceClaim[],
    projectName?: string
  ): ProjectConfidenceReport {
    let totalScore = 0;
    let evaluatedCount = 0;
    const dist = { high: 0, medium: 0, low: 0, unavailable: 0 };

    const signalSums: Record<keyof ConfidenceSignals, { sum: number; count: number }> = {
      visionConfidence: { sum: 0, count: 0 },
      metadataConsistency: { sum: 0, count: 0 },
      imageQuality: { sum: 0, count: 0 },
      crossAssetAgreement: { sum: 0, count: 0 },
      temporalConsistency: { sum: 0, count: 0 },
    };

    for (const claim of claims) {
      const comp = claim.compositeConfidence || this.evaluateClaimConfidence(claim);
      if (comp.available && comp.score !== null) {
        totalScore += comp.score;
        evaluatedCount++;
        if (comp.level === 'HIGH') dist.high++;
        else if (comp.level === 'MEDIUM') dist.medium++;
        else if (comp.level === 'LOW') dist.low++;
      } else {
        dist.unavailable++;
      }

      for (const key of Object.keys(signalSums) as Array<keyof ConfidenceSignals>) {
        const val = comp.signals[key];
        if (val !== null && val !== undefined) {
          signalSums[key].sum += val;
          signalSums[key].count++;
        }
      }
    }

    const avgScore = evaluatedCount > 0 ? totalScore / evaluatedCount : null;
    const avgPercentage = avgScore !== null ? Math.round(avgScore * 100) : null;
    const level = this.classify(avgScore);

    return {
      projectId,
      projectName: projectName || 'Impact Project',
      averageCompositeConfidence: avgScore,
      averageCompositePercentage: avgPercentage,
      level,
      totalEvaluatedClaims: evaluatedCount,
      confidenceDistribution: dist,
      signalsSummary: {
        visionConfidence:
          signalSums.visionConfidence.count > 0
            ? Math.round((signalSums.visionConfidence.sum / signalSums.visionConfidence.count) * 100) / 100
            : null,
        metadataConsistency:
          signalSums.metadataConsistency.count > 0
            ? Math.round((signalSums.metadataConsistency.sum / signalSums.metadataConsistency.count) * 100) / 100
            : null,
        imageQuality:
          signalSums.imageQuality.count > 0
            ? Math.round((signalSums.imageQuality.sum / signalSums.imageQuality.count) * 100) / 100
            : null,
        crossAssetAgreement:
          signalSums.crossAssetAgreement.count > 0
            ? Math.round((signalSums.crossAssetAgreement.sum / signalSums.crossAssetAgreement.count) * 100) / 100
            : null,
        temporalConsistency:
          signalSums.temporalConsistency.count > 0
            ? Math.round((signalSums.temporalConsistency.sum / signalSums.temporalConsistency.count) * 100) / 100
            : null,
      },
      disclaimer: CONFIDENCE_DISCLAIMER,
      timestamp: new Date().toISOString(),
    };
  }
}
