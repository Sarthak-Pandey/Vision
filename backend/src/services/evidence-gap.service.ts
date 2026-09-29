import { ProjectService } from './project.service.js';
import { ClaimRepository } from '../repositories/claim.repository.js';
import { ComparisonRepository } from '../repositories/comparison.repository.js';
import { AssetRepository } from '../repositories/asset.repository.js';
import { AiAnalysisRepository } from '../repositories/ai-analysis.repository.js';
import {
  EvidenceCategory,
  ProjectType,
  EvidenceGapReport,
  EvidenceCategoryStatus,
  EvidenceCategorySource,
  EvidenceClaim,
  ComparisonRecord,
  Asset,
} from '../types/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export const EVIDENCE_REQUIREMENTS: Record<string, EvidenceCategory[]> = {
  tree_plantation: [
    'initial_condition',
    'activity',
    'immediate_result',
    'long_term_outcome',
    'beneficiary_evidence',
    'quantitative_measurement',
  ],
  river_restoration: [
    'initial_condition',
    'activity',
    'immediate_result',
    'long_term_outcome',
    'beneficiary_evidence',
    'quantitative_measurement',
  ],
  solar_installation: [
    'initial_condition',
    'activity',
    'immediate_result',
    'long_term_outcome',
    'quantitative_measurement',
  ],
  waste_cleanup: [
    'initial_condition',
    'activity',
    'immediate_result',
    'beneficiary_evidence',
    'quantitative_measurement',
  ],
};

export const EVIDENCE_CATEGORY_META: Record<
  EvidenceCategory,
  { label: string; description: string; suggestion: string }
> = {
  initial_condition: {
    label: 'Initial Condition',
    description: 'Pre-intervention baseline state documenting the physical site condition before activities commenced.',
    suggestion: 'Upload photographic evidence of the project site prior to starting field operations.',
  },
  activity: {
    label: 'Activity',
    description: 'Active field operations, labor, excavation, planting, cleanup, or equipment installation in progress.',
    suggestion: 'Capture photographs documenting workers and field teams actively executing implementation tasks.',
  },
  immediate_result: {
    label: 'Immediate Result',
    description: 'Visible site condition immediately following the completion of direct field interventions.',
    suggestion: 'Document the site immediately after activity completion (e.g., freshly planted saplings, cleared riverbank).',
  },
  long_term_outcome: {
    label: 'Long-Term Outcome',
    description: 'Sustained ecological or environmental transformation verified over an extended operational timeline.',
    suggestion: 'Conduct a Before/After comparison with new photographs taken after a multi-month growth or recovery period.',
  },
  beneficiary_evidence: {
    label: 'Beneficiary Evidence',
    description: 'Verified community engagement, stakeholder consultation, local employment, or direct community benefit records.',
    suggestion: 'Link verified stakeholder feedback, community distribution sign-offs, or direct employment records.',
  },
  quantitative_measurement: {
    label: 'Quantitative Measurement',
    description: 'Audited numerical measurements, sensor outputs, survival rate surveys, or energy generation logs.',
    suggestion: 'Attach verified quantitative field survey records (e.g. survival counts, kg of waste diverted, kW generated).',
  },
};

export class EvidenceGapService {
  private projectService: ProjectService;
  private claimRepo: ClaimRepository;
  private comparisonRepo: ComparisonRepository;
  private assetRepo: AssetRepository;
  private aiAnalysisRepo: AiAnalysisRepository;

  constructor() {
    this.projectService = new ProjectService();
    this.claimRepo = new ClaimRepository();
    this.comparisonRepo = new ComparisonRepository();
    this.assetRepo = new AssetRepository();
    this.aiAnalysisRepo = new AiAnalysisRepository();
  }

  getExpectedEvidence(projectType?: ProjectType | string | null): EvidenceCategory[] {
    if (!projectType) return [];
    const normalized = projectType.trim().toLowerCase();
    return EVIDENCE_REQUIREMENTS[normalized] || [];
  }

  inferProjectType(project: { name: string; description?: string | null; project_type?: string | null }): ProjectType {
    if (project.project_type && project.project_type in EVIDENCE_REQUIREMENTS) {
      return project.project_type as ProjectType;
    }

    const text = `${project.name} ${project.description || ''}`.toLowerCase();
    if (text.includes('tree') || text.includes('plantation') || text.includes('mangrove') || text.includes('reforestation')) {
      return 'tree_plantation';
    }
    if (text.includes('river') || text.includes('yamuna') || text.includes('riparian') || text.includes('stream') || text.includes('wetland')) {
      return 'river_restoration';
    }
    if (text.includes('solar') || text.includes('microgrid') || text.includes('photovoltaic') || text.includes('panel')) {
      return 'solar_installation';
    }
    if (text.includes('waste') || text.includes('clean-up') || text.includes('cleanup') || text.includes('plastic') || text.includes('debris')) {
      return 'waste_cleanup';
    }

    return 'other';
  }

  async detectEvidenceGaps(projectId: string, userId?: string): Promise<EvidenceGapReport> {
    if (!projectId || !projectId.trim()) {
      throw new ValidationError('Project ID is required');
    }

    // 1. Authorize project access (prevents IDOR and cross-tenant leakage)
    const project = await this.projectService.getProjectById(projectId, userId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} not found`);
    }

    // 2. Resolve project type and expected evidence requirements
    const projectType = this.inferProjectType(project);
    const expected = this.getExpectedEvidence(projectType);
    const isConfigured = expected.length > 0;

    // 3. Query existing project-scoped evidence records (strict project_id isolation)
    const [claims, comparisons, assets] = await Promise.all([
      this.claimRepo.findByProjectId(projectId),
      this.comparisonRepo.findByProjectId(projectId),
      this.assetRepo.findByProjectId(projectId),
    ]);

    // Build asset map for quick lookup
    const assetMap = new Map<string, Asset>();
    for (const a of assets) {
      assetMap.set(a.id, a);
    }

    // 4. Map existing evidence into categories
    const categorySourcesMap = new Map<EvidenceCategory, Map<string, EvidenceCategorySource>>();

    const addSource = (
      cat: EvidenceCategory,
      assetId: string,
      meta?: {
        claimId?: string;
        claimText?: string;
        sourceType?: string;
        role?: string;
      }
    ) => {
      if (!categorySourcesMap.has(cat)) {
        categorySourcesMap.set(cat, new Map());
      }
      const catMap = categorySourcesMap.get(cat)!;
      if (!catMap.has(assetId)) {
        const asset = assetMap.get(assetId);
        catMap.set(assetId, {
          assetId,
          url: asset?.url || '',
          type: asset?.type || 'image',
          captureDate: asset?.capture_date || asset?.created_at || null,
          claimId: meta?.claimId,
          claimText: meta?.claimText,
          sourceType: meta?.sourceType,
          role: meta?.role,
        });
      }
    };

    // A. Evaluate Claims and Linked Evidence
    for (const claim of claims) {
      const claimText = claim.claim.toLowerCase();

      // Explicit category if set on claim
      if (claim.category && claim.category in EVIDENCE_CATEGORY_META) {
        for (const ev of claim.evidence) {
          addSource(claim.category as EvidenceCategory, ev.assetId, {
            claimId: claim.id,
            claimText: claim.claim,
            sourceType: claim.sourceType,
            role: ev.role,
          });
        }
      }

      // Initial condition indicators
      if (
        claimText.includes('initial') ||
        claimText.includes('baseline') ||
        claimText.includes('before') ||
        claimText.includes('bare soil') ||
        claimText.includes('barren') ||
        claimText.includes('degraded') ||
        claimText.includes('prior to')
      ) {
        for (const ev of claim.evidence) {
          addSource('initial_condition', ev.assetId, {
            claimId: claim.id,
            claimText: claim.claim,
            sourceType: claim.sourceType,
            role: ev.role,
          });
        }
      }

      // Activity indicators
      if (
        claimText.includes('plant') ||
        claimText.includes('clean') ||
        claimText.includes('install') ||
        claimText.includes('work') ||
        claimText.includes('active') ||
        claimText.includes('excavat') ||
        claimText.includes('stabiliz') ||
        claimText.includes('operation')
      ) {
        for (const ev of claim.evidence) {
          addSource('activity', ev.assetId, {
            claimId: claim.id,
            claimText: claim.claim,
            sourceType: claim.sourceType,
            role: ev.role,
          });
        }
      }

      // Immediate result indicators
      if (
        claimText.includes('newly') ||
        claimText.includes('freshly') ||
        claimText.includes('young sapling') ||
        claimText.includes('cleared waste') ||
        claimText.includes('debris removed') ||
        claimText.includes('immediate') ||
        claimText.includes('completed')
      ) {
        for (const ev of claim.evidence) {
          addSource('immediate_result', ev.assetId, {
            claimId: claim.id,
            claimText: claim.claim,
            sourceType: claim.sourceType,
            role: ev.role,
          });
        }
      }

      // Beneficiary Evidence - Strict validation: only if explicit beneficiary terminology exists
      if (
        claimText.includes('beneficiary') ||
        claimText.includes('community distribution') ||
        claimText.includes('stakeholder sign-off') ||
        claimText.includes('household electrified') ||
        claimText.includes('local employment verification')
      ) {
        for (const ev of claim.evidence) {
          addSource('beneficiary_evidence', ev.assetId, {
            claimId: claim.id,
            claimText: claim.claim,
            sourceType: claim.sourceType,
            role: ev.role,
          });
        }
      }

      // Quantitative Measurement - Strict validation: only if explicit measurement terminology exists
      if (
        claimText.includes('measured survival rate') ||
        claimText.includes('kw generated') ||
        claimText.includes('quantitative measurement') ||
        claimText.includes('sensor output') ||
        claimText.includes('metric audit')
      ) {
        for (const ev of claim.evidence) {
          addSource('quantitative_measurement', ev.assetId, {
            claimId: claim.id,
            claimText: claim.claim,
            sourceType: claim.sourceType,
            role: ev.role,
          });
        }
      }
    }

    // B. Evaluate Phase 5 Before/After Comparisons for Long-Term Outcome & Initial Condition
    for (const comp of comparisons) {
      if (comp.status !== 'completed') continue;

      const beforeAsset = assetMap.get(comp.before_asset_id);
      const afterAsset = assetMap.get(comp.after_asset_id);

      // The Before asset directly verifies the initial condition
      addSource('initial_condition', comp.before_asset_id, {
        sourceType: 'comparison',
        role: 'before',
        claimText: `Baseline condition documented prior to comparison ${comp.id}`,
      });

      // Calculate time span between Before and After photos
      const beforeTime = beforeAsset?.capture_date || beforeAsset?.created_at;
      const afterTime = afterAsset?.capture_date || afterAsset?.created_at;
      let daysDifference = 0;

      if (beforeTime && afterTime) {
        const diffMs = Math.abs(new Date(afterTime).getTime() - new Date(beforeTime).getTime());
        daysDifference = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      const summaryText = (comp.comparison_result?.summary || '').toLowerCase();
      const hasVegetationOrRecovery =
        summaryText.includes('vegetation') ||
        summaryText.includes('growth') ||
        summaryText.includes('stabiliz') ||
        summaryText.includes('regrowth') ||
        summaryText.includes('increase');

      // Rule: If comparison spans >= 30 days (or has visible sustained recovery), classifies as long_term_outcome
      if (daysDifference >= 30 || hasVegetationOrRecovery) {
        addSource('long_term_outcome', comp.after_asset_id, {
          sourceType: 'comparison',
          role: 'after',
          claimText: comp.comparison_result?.summary || 'Sustained observable transformation',
        });
      } else {
        addSource('immediate_result', comp.after_asset_id, {
          sourceType: 'comparison',
          role: 'after',
          claimText: comp.comparison_result?.summary || 'Immediate post-intervention visual change',
        });
      }
    }

    // 5. Determine Available vs. Missing Categories
    const allDetectedCategories = Array.from(categorySourcesMap.keys());
    const available = expected.filter((cat) => (categorySourcesMap.get(cat)?.size || 0) > 0);
    const missing = expected.filter((cat) => !available.includes(cat));

    // 6. Build category status objects for each expected requirement
    const categories: EvidenceCategoryStatus[] = expected.map((cat) => {
      const meta = EVIDENCE_CATEGORY_META[cat];
      const sourceMap = categorySourcesMap.get(cat);
      const isCatAvailable = (sourceMap?.size || 0) > 0;
      const sources: EvidenceCategorySource[] = sourceMap ? Array.from(sourceMap.values()) : [];

      return {
        category: cat,
        label: meta.label,
        status: isCatAvailable ? 'available' : 'missing',
        evidenceCount: sources.length,
        sources,
        explanation: isCatAvailable
          ? `Qualifying evidence is available and verified through ${sources.length} supporting media record${sources.length === 1 ? '' : 's'}.`
          : `No qualifying ${meta.label.toLowerCase()} evidence has been identified for this project yet.`,
        suggestedNextAction: isCatAvailable ? undefined : meta.suggestion,
      };
    });

    // 7. Calculate coverage summary
    const coverageAvailable = available.length;
    const coverageExpected = expected.length;
    const percentage = coverageExpected > 0 ? Math.round((coverageAvailable / coverageExpected) * 100) : 0;

    return {
      projectId: project.id,
      projectName: project.name,
      projectType,
      projectTypeConfigured: isConfigured,
      expected,
      available,
      missing,
      coverage: {
        available: coverageAvailable,
        expected: coverageExpected,
        percentage,
      },
      categories,
      timestamp: new Date().toISOString(),
    };
  }
}
