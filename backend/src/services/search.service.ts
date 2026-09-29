import { EmbeddingService } from './embedding.service.js';
import { EmbeddingRepository } from '../repositories/embedding.repository.js';
import { ProjectService } from './project.service.js';
import { Asset, SearchResult, SemanticSearchParams, IndexingStats } from '../types/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export const DEFAULT_SEARCH_THRESHOLD = 0.22;
export const DEFAULT_SEARCH_LIMIT = 10;

export class SearchService {
  private embeddingService: EmbeddingService;
  private embeddingRepository: EmbeddingRepository;
  private projectService: ProjectService;

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.embeddingRepository = new EmbeddingRepository();
    this.projectService = new ProjectService();
  }

  async search(
    params: SemanticSearchParams,
    userId?: string
  ): Promise<{ results: SearchResult[]; total: number; query: string; threshold: number }> {
    const { projectId, query, mediaType, startDate, endDate } = params;

    // 1. Authorize: Enforce that the requesting user owns or has access to this project
    await this.projectService.getProjectById(projectId, userId);

    const trimmedQuery = (query || '').trim();
    if (!trimmedQuery) {
      throw new ValidationError('Search query cannot be empty');
    }

    if (trimmedQuery.length > 500) {
      throw new ValidationError('Search query exceeds maximum length of 500 characters');
    }

    // 2. Generate text query embedding in the shared multimodal vector space
    console.log(`[SearchService] Generating query embedding for: "${trimmedQuery.slice(0, 40)}" (project: ${projectId})`);
    const queryVector = await this.embeddingService.embedText(trimmedQuery);

    const threshold = typeof params.threshold === 'number' ? params.threshold : DEFAULT_SEARCH_THRESHOLD;
    const limit = typeof params.limit === 'number' ? Math.min(Math.max(params.limit, 1), 50) : DEFAULT_SEARCH_LIMIT;

    // 3. Execute pgvector similarity search scoped strictly to the project
    const results = await this.embeddingRepository.searchSimilar(
      queryVector,
      projectId,
      threshold,
      limit,
      { mediaType, startDate, endDate }
    );

    return {
      results,
      total: results.length,
      query: trimmedQuery,
      threshold,
    };
  }

  async indexAsset(asset: Asset): Promise<boolean> {
    if (!asset || !asset.url) return false;

    // Only images are indexed in Phase 4 multimodal image search
    if (asset.type && asset.type !== 'image') {
      return false;
    }

    try {
      console.log(`[SearchService] Generating image embedding for asset: ${asset.id}`);
      const vector = await this.embeddingService.embedImage(asset.url);
      await this.embeddingRepository.upsert(asset.id, vector, this.embeddingService.getModelName());
      console.log(`[SearchService] Successfully stored embedding for asset: ${asset.id}`);
      return true;
    } catch (err: any) {
      // Safe error isolation: log warning and mark failed/retryable, do NOT delete or corrupt asset
      console.warn(`[SearchService] Failed to generate/store embedding for asset ${asset.id}:`, err.message);
      return false;
    }
  }

  async backfill(
    projectId: string,
    userId?: string,
    batchSize = 20
  ): Promise<{ processed: number; successful: number; failed: number; pending: number }> {
    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      throw new ValidationError('Project ID is required for backfill');
    }

    const trimmedProjectId = projectId.trim();

    // 1. Authorize: Enforce that the requesting user owns or has access to this project
    await this.projectService.getProjectById(trimmedProjectId, userId);

    // 2. Clamp batchSize between 1 and 100 to prevent runaway embedding resource usage
    const clampedBatchSize = Math.min(Math.max(Number(batchSize) || 20, 1), 100);

    const model = this.embeddingService.getModelName();
    const unindexed = await this.embeddingRepository.findUnindexedImageAssets(
      trimmedProjectId,
      clampedBatchSize,
      model
    );
    let successful = 0;
    let failed = 0;

    for (const asset of unindexed) {
      const ok = await this.indexAsset(asset);
      if (ok) {
        successful++;
      } else {
        failed++;
      }
    }

    const stats = await this.embeddingRepository.getIndexingStats(trimmedProjectId, model);

    return {
      processed: unindexed.length,
      successful,
      failed,
      pending: stats.pending,
    };
  }

  async getIndexingStats(projectId: string, userId?: string): Promise<IndexingStats> {
    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      throw new ValidationError('Project ID is required for indexing statistics');
    }

    const trimmedProjectId = projectId.trim();

    // Authorize: Enforce that the requesting user owns or has access to this project
    await this.projectService.getProjectById(trimmedProjectId, userId);

    const model = this.embeddingService.getModelName();
    return this.embeddingRepository.getIndexingStats(trimmedProjectId, model);
  }
}
