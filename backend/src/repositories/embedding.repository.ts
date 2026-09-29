import { supabase, isSupabaseConfigured } from '../config/database.js';
import { EmbeddingRecord, SearchResult, IndexingStats, Asset } from '../types/index.js';
import { AiAnalysisRepository } from './ai-analysis.repository.js';
import { AssetRepository } from './asset.repository.js';

const mockEmbeddingsStore: EmbeddingRecord[] = [];

export class EmbeddingRepository {
  private aiAnalysisRepo: AiAnalysisRepository;
  private assetRepo: AssetRepository;

  constructor() {
    this.aiAnalysisRepo = new AiAnalysisRepository();
    this.assetRepo = new AssetRepository();
  }

  async upsert(assetId: string, embedding: number[], model: string): Promise<EmbeddingRecord> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      // Pass vector as string or array supported by pgvector
      const vectorPayload = `[${embedding.join(',')}]`;

      const { data, error } = await supabase
        .from('embeddings')
        .upsert(
          {
            asset_id: assetId,
            embedding: vectorPayload as any,
            model,
            updated_at: now,
          },
          { onConflict: 'asset_id,model' }
        )
        .select()
        .single();

      if (error) {
        console.error('[EmbeddingRepository] Supabase upsert error:', error.message);
        throw new Error(`Failed to save embedding in database: ${error.message}`);
      }

      return data as EmbeddingRecord;
    }

    // In-memory fallback
    const existingIndex = mockEmbeddingsStore.findIndex(
      (e) => e.asset_id === assetId && e.model === model
    );
    const record: EmbeddingRecord = {
      id: existingIndex >= 0 ? mockEmbeddingsStore[existingIndex].id : `emb-${Date.now()}`,
      asset_id: assetId,
      embedding,
      model,
      created_at: existingIndex >= 0 ? mockEmbeddingsStore[existingIndex].created_at : now,
      updated_at: now,
    };

    if (existingIndex >= 0) {
      mockEmbeddingsStore[existingIndex] = record;
    } else {
      mockEmbeddingsStore.push(record);
    }

    return record;
  }

  async findByAssetId(assetId: string): Promise<EmbeddingRecord | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('embeddings')
        .select('*')
        .eq('asset_id', assetId)
        .maybeSingle();

      if (error) {
        console.warn('[EmbeddingRepository] findByAssetId error:', error.message);
        return null;
      }
      return data as EmbeddingRecord | null;
    }

    return mockEmbeddingsStore.find((e) => e.asset_id === assetId) || null;
  }

  async searchSimilar(
    queryVector: number[],
    projectId: string,
    threshold = 0.20,
    limit = 10,
    filters?: { mediaType?: string; startDate?: string; endDate?: string }
  ): Promise<SearchResult[]> {
    let results: SearchResult[] = [];

    if (isSupabaseConfigured() && supabase) {
      const vectorPayload = `[${queryVector.join(',')}]`;

      const rpcParams: Record<string, any> = {
        query_embedding: vectorPayload,
        filter_project_id: projectId,
        match_threshold: threshold,
        match_count: limit,
        filter_media_type: filters?.mediaType || null,
        filter_start_date: filters?.startDate || null,
        filter_end_date: filters?.endDate || null,
      };

      let { data, error } = await supabase.rpc('match_assets', rpcParams);

      // Backwards compatibility fallback only if remote database reports function signature mismatch (PGRST202)
      if (error && error.code === 'PGRST202') {
        const legacyRes = await supabase.rpc('match_assets', {
          query_embedding: vectorPayload,
          filter_project_id: projectId,
          match_threshold: threshold,
          match_count: limit * 2,
        });
        data = legacyRes.data;
        error = legacyRes.error;

        if (data && filters) {
          if (filters.mediaType) {
            data = data.filter((r: any) => r.type === filters.mediaType);
          }
          if (filters.startDate) {
            const start = new Date(filters.startDate).getTime();
            data = data.filter((r: any) => !r.capture_date || new Date(r.capture_date).getTime() >= start);
          }
          if (filters.endDate) {
            const end = new Date(filters.endDate).getTime();
            data = data.filter((r: any) => !r.capture_date || new Date(r.capture_date).getTime() <= end);
          }
          data = data.slice(0, limit);
        }
      }

      if (error) {
        console.error('[EmbeddingRepository] match_assets RPC error:', error.message);
        throw new Error(`Vector similarity search failed: ${error.message}`);
      }

      results = (data || []).map((row: any) => ({
        asset_id: row.asset_id,
        url: row.url,
        type: row.type || 'image',
        capture_date: row.capture_date,
        latitude: row.latitude ? Number(row.latitude) : null,
        longitude: row.longitude ? Number(row.longitude) : null,
        project_id: row.project_id,
        similarity: Number(row.similarity),
      }));
    } else {
      // In-memory fallback similarity search strictly scoped to project and filtered before limit
      results = await this.mockSearchSimilar(queryVector, projectId, threshold, limit, filters);
    }

    // Enrich with AI Analysis metadata (activities, descriptions) without N+1 queries
    if (results.length > 0) {
      const assetIds = results.map((r) => r.asset_id);
      try {
        const analysisMap = await this.aiAnalysisRepo.findLatestByAssetIds(assetIds);
        for (const item of results) {
          const analysis = analysisMap.get(item.asset_id);
          if (analysis) {
            item.activity = analysis.activities?.[0] || analysis.scene || null;
            item.description = analysis.description || null;
          }
        }
      } catch (err: any) {
        console.warn('[EmbeddingRepository] Failed to enrich search results with AI analysis:', err.message);
      }
    }

    return results;
  }

  async getIndexingStats(projectId: string, model = 'gemini-embedding-2'): Promise<IndexingStats> {
    if (!projectId) {
      throw new Error('Project ID is required for indexing statistics');
    }

    if (isSupabaseConfigured() && supabase) {
      // 1. Total image assets count strictly for the project (head: true, no row data transfer)
      const { count: totalCount, error: assetErr } = await supabase
        .from('assets')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'image')
        .eq('project_id', projectId);

      if (assetErr) {
        throw new Error(`Failed to query project assets: ${assetErr.message}`);
      }

      const total = totalCount || 0;
      if (total === 0) {
        return { total: 0, indexed: 0, pending: 0 };
      }

      // 2. Count distinct indexed assets for this model via PostgREST inner join (head: true)
      const { count: indexedCount, error: embErr } = await supabase
        .from('embeddings')
        .select('asset_id, assets!inner(project_id, type)', { count: 'exact', head: true })
        .eq('assets.project_id', projectId)
        .eq('assets.type', 'image')
        .eq('model', model);

      if (embErr) {
        throw new Error(`Failed to query embedding stats: ${embErr.message}`);
      }

      const indexed = indexedCount || 0;
      return {
        total,
        indexed,
        pending: Math.max(0, total - indexed),
      };
    }

    const projectAssets = await this.assetRepo.findByProjectId(projectId);
    const imageAssets = projectAssets.filter((a) => a.type === 'image');
    const indexed = imageAssets.filter((a) =>
      mockEmbeddingsStore.some((e) => e.asset_id === a.id && (!model || e.model === model))
    ).length;
    return {
      total: imageAssets.length,
      indexed,
      pending: Math.max(0, imageAssets.length - indexed),
    };
  }

  async findUnindexedImageAssets(
    projectId: string,
    limit = 50,
    model = 'gemini-embedding-2'
  ): Promise<Asset[]> {
    if (!projectId) {
      throw new Error('Project ID is required to find unindexed assets');
    }

    if (isSupabaseConfigured() && supabase) {
      // 1. Fetch image assets strictly for the project
      const { data: assets, error: assetErr } = await supabase
        .from('assets')
        .select('*')
        .eq('type', 'image')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (assetErr) {
        throw new Error(`Failed to fetch image assets: ${assetErr.message}`);
      }
      if (!assets || assets.length === 0) return [];

      // 2. Fetch existing embedding asset_ids for the target model
      const assetIds = assets.map((a) => a.id);
      const { data: existingEmbs, error: embErr } = await supabase
        .from('embeddings')
        .select('asset_id')
        .eq('model', model)
        .in('asset_id', assetIds);

      if (embErr) {
        throw new Error(`Failed to fetch embeddings: ${embErr.message}`);
      }

      const indexedSet = new Set((existingEmbs || []).map((e) => e.asset_id));
      const unindexed = assets.filter((a) => !indexedSet.has(a.id));
      return unindexed.slice(0, limit) as Asset[];
    }

    const projectAssets = await this.assetRepo.findByProjectId(projectId);
    const imageAssets = projectAssets.filter((a) => a.type === 'image');
    const indexedSet = new Set(
      mockEmbeddingsStore
        .filter((e) => !model || e.model === model)
        .map((e) => e.asset_id)
    );
    return imageAssets.filter((a) => !indexedSet.has(a.id)).slice(0, limit);
  }

  private async mockSearchSimilar(
    queryVector: number[],
    projectId: string,
    threshold: number,
    limit: number,
    filters?: { mediaType?: string; startDate?: string; endDate?: string }
  ): Promise<SearchResult[]> {
    const matches: SearchResult[] = [];
    const projectAssets = await this.assetRepo.findByProjectId(projectId);

    for (const asset of projectAssets) {
      if (filters?.mediaType && asset.type !== filters.mediaType) {
        continue;
      }
      if (filters?.startDate && asset.capture_date) {
        if (new Date(asset.capture_date).getTime() < new Date(filters.startDate).getTime()) {
          continue;
        }
      }
      if (filters?.endDate && asset.capture_date) {
        if (new Date(asset.capture_date).getTime() > new Date(filters.endDate).getTime()) {
          continue;
        }
      }

      const emb = mockEmbeddingsStore.find((e) => e.asset_id === asset.id);
      if (!emb) continue;

      let dot = 0, normA = 0, normB = 0;
      for (let i = 0; i < queryVector.length; i++) {
        dot += queryVector[i] * emb.embedding[i];
        normA += queryVector[i] * queryVector[i];
        normB += emb.embedding[i] * emb.embedding[i];
      }
      const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);

      if (similarity >= threshold) {
        matches.push({
          asset_id: asset.id,
          url: asset.url || '',
          type: asset.type || 'image',
          capture_date: asset.capture_date,
          latitude: asset.latitude,
          longitude: asset.longitude,
          project_id: asset.project_id,
          similarity: Number(similarity.toFixed(4)),
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }
}
