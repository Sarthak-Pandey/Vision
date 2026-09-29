import { ProjectService } from './project.service.js';
import { AssetService } from './asset.service.js';
import { ClaimRepository } from '../repositories/claim.repository.js';
import { AiAnalysisRepository } from '../repositories/ai-analysis.repository.js';
import { ComparisonRepository } from '../repositories/comparison.repository.js';
import {
  EvidenceClaim,
  ClaimsTelemetry,
  Asset,
  AiAnalysis,
  ComparisonRecord,
} from '../types/index.js';
import { CreateClaimSchema, GetClaimsQuerySchema } from '../schemas/claim.schema.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export class ClaimService {
  private projectService: ProjectService;
  private assetService: AssetService;
  private claimRepo: ClaimRepository;
  private aiAnalysisRepo: AiAnalysisRepository;
  private comparisonRepo: ComparisonRepository;

  constructor() {
    this.projectService = new ProjectService();
    this.assetService = new AssetService();
    this.claimRepo = new ClaimRepository();
    this.aiAnalysisRepo = new AiAnalysisRepository();
    this.comparisonRepo = new ComparisonRepository();
  }

  async getClaims(
    projectId: string,
    filters?: GetClaimsQuerySchema,
    userId?: string
  ): Promise<{ claims: EvidenceClaim[]; telemetry: ClaimsTelemetry }> {
    if (!projectId || !projectId.trim()) {
      throw new ValidationError('Project ID is required');
    }

    // 1. Authorize project access
    await this.projectService.getProjectById(projectId, userId);

    const [claims, telemetry] = await Promise.all([
      this.claimRepo.findByProjectId(projectId, filters),
      this.claimRepo.getTelemetry(projectId),
    ]);

    return { claims, telemetry };
  }

  async getClaimById(projectId: string, claimId: string, userId?: string): Promise<EvidenceClaim> {
    if (!projectId || !projectId.trim()) {
      throw new ValidationError('Project ID is required');
    }
    if (!claimId || !claimId.trim()) {
      throw new ValidationError('Claim ID is required');
    }

    // 1. Authorize project access
    await this.projectService.getProjectById(projectId, userId);

    const claim = await this.claimRepo.findById(claimId);
    if (!claim || claim.projectId !== projectId) {
      throw new NotFoundError(`Claim with ID ${claimId} not found in this project`);
    }

    return claim;
  }

  async createClaim(
    projectId: string,
    input: CreateClaimSchema,
    userId?: string
  ): Promise<EvidenceClaim> {
    const { claim, confidence, sourceType, sourceId, evidenceAssetIds } = input;

    // 1. Authorize project access
    await this.projectService.getProjectById(projectId, userId);

    const trimmedClaim = (claim || '').trim();
    if (!trimmedClaim) {
      throw new ValidationError('Claim statement cannot be empty');
    }

    if (confidence < 0 || confidence > 1) {
      throw new ValidationError('Confidence must be a number between 0.0 and 1.0');
    }

    if (!evidenceAssetIds || evidenceAssetIds.length === 0) {
      throw new ValidationError('A claim must have at least one supporting evidence asset');
    }

    // 2. Validate all evidence assets belong to this project
    const verifiedAssetIds: string[] = [];
    for (const assetId of evidenceAssetIds) {
      const asset = await this.assetService.getAssetById(assetId);
      if (!asset) {
        throw new NotFoundError(`Evidence asset with ID ${assetId} not found`);
      }
      if (asset.project_id !== projectId) {
        throw new ValidationError(
          `Cross-project reference error: Asset ${assetId} does not belong to project ${projectId}`
        );
      }
      verifiedAssetIds.push(asset.id);
    }

    return this.claimRepo.createClaim({
      projectId,
      claim: trimmedClaim,
      confidence,
      sourceType,
      sourceId: sourceId || null,
      evidenceAssetIds: verifiedAssetIds,
      createdBy: userId || null,
    });
  }

  async generateClaimsFromPhase2(
    projectId: string,
    asset: Asset,
    analysis: AiAnalysis,
    userId?: string
  ): Promise<EvidenceClaim[]> {
    if (!analysis || !asset) return [];

    // Verify asset belongs to project
    if (asset.project_id !== projectId) {
      throw new ValidationError(`Asset ${asset.id} does not belong to project ${projectId}`);
    }

    const createdClaims: EvidenceClaim[] = [];
    const confidence = Math.min(Math.max(Number(analysis.confidence) || 0.85, 0), 1);

    // 1. Generate claim from primary identified activity
    if (analysis.activities && analysis.activities.length > 0) {
      for (const act of analysis.activities) {
        const trimmedAct = act.trim();
        if (trimmedAct.length >= 3) {
          const claimStatement = `${trimmedAct.charAt(0).toUpperCase() + trimmedAct.slice(1)} observed`;
          const claim = await this.claimRepo.createClaim({
            projectId,
            claim: claimStatement,
            confidence,
            sourceType: 'asset_analysis',
            sourceId: analysis.id,
            evidenceAssetIds: [asset.id],
            createdBy: userId || null,
          });
          createdClaims.push(claim);
        }
      }
    }

    // 2. Generate claim from visible physical condition if distinct and informative
    if (
      analysis.visible_condition &&
      analysis.visible_condition.trim().length > 5 &&
      !analysis.visible_condition.toLowerCase().includes('simulated')
    ) {
      const conditionClaim = `Physical condition observed: ${analysis.visible_condition.trim()}`;
      const claim = await this.claimRepo.createClaim({
        projectId,
        claim: conditionClaim,
        confidence,
        sourceType: 'asset_analysis',
        sourceId: analysis.id,
        evidenceAssetIds: [asset.id],
        createdBy: userId || null,
      });
      createdClaims.push(claim);
    }

    return createdClaims;
  }

  async generateClaimsFromPhase5(
    projectId: string,
    comparison: ComparisonRecord,
    userId?: string
  ): Promise<EvidenceClaim[]> {
    if (!comparison || comparison.status === 'failed') return [];

    if (comparison.project_id !== projectId) {
      throw new ValidationError(`Comparison ${comparison.id} does not belong to project ${projectId}`);
    }

    const createdClaims: EvidenceClaim[] = [];
    const changes = comparison.comparison_result?.changes || [];

    for (const change of changes) {
      const desc = (change.description || '').trim();
      if (desc.length > 3) {
        const confidence = Math.min(
          Math.max(Number(change.confidence || comparison.confidence) || 0.85, 0),
          1
        );
        const claim = await this.claimRepo.createClaim({
          projectId,
          claim: desc,
          confidence,
          sourceType: 'comparison',
          sourceId: comparison.id,
          evidenceAssetIds: [comparison.before_asset_id, comparison.after_asset_id],
          createdBy: userId || null,
        });
        createdClaims.push(claim);
      }
    }

    return createdClaims;
  }

  async syncProjectClaims(
    projectId: string,
    userId?: string
  ): Promise<{ syncedClaims: number; generated: number; total: number }> {
    // 1. Authorize project
    await this.projectService.getProjectById(projectId, userId);

    let generatedCount = 0;

    // 2. Sync from Phase 2 AI Analyses
    const projectAssets = await this.assetService.getAssetsByProject(projectId);
    for (const asset of projectAssets) {
      const analysis = await this.aiAnalysisRepo.findByAssetId(asset.id);
      if (analysis) {
        const claims = await this.generateClaimsFromPhase2(projectId, asset, analysis, userId);
        generatedCount += claims.length;
      }
    }

    // 3. Sync from Phase 5 Comparisons
    const comparisons = await this.comparisonRepo.findByProjectId(projectId);
    for (const comp of comparisons) {
      const claims = await this.generateClaimsFromPhase5(projectId, comp, userId);
      generatedCount += claims.length;
    }

    const allClaims = await this.claimRepo.findByProjectId(projectId);

    return {
      syncedClaims: generatedCount,
      generated: generatedCount,
      total: allClaims.length,
    };
  }
}
