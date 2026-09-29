import { supabase, isSupabaseConfigured } from '../config/database.js';
import { ComparisonRecord, ComparisonResult } from '../types/index.js';
import { AssetRepository } from './asset.repository.js';
import { randomUUID } from 'crypto';

const mockComparisonsStore: ComparisonRecord[] = [
  {
    id: 'comp-seed-1',
    project_id: 'proj-1',
    before_asset_id: 'asset-1',
    after_asset_id: 'asset-2',
    comparison_result: {
      summary:
        'The after image demonstrates increased visible vegetation cover with newly stabilized soil along the riverbank corridor, while visible surface waste has been cleared.',
      changes: [
        {
          description: 'Increased visible green ground cover and young sapling foliage',
          category: 'vegetation',
          direction: 'increase',
          confidence: 0.92,
        },
        {
          description: 'Reduced visible surface debris and loose waste along the bank',
          category: 'waste',
          direction: 'decrease',
          confidence: 0.88,
        },
        {
          description: 'Stabilized soil embankment visible along the water edge',
          category: 'land',
          direction: 'changed',
          confidence: 0.84,
        },
      ],
      overall_confidence: 0.89,
    },
    confidence: 0.89,
    status: 'completed',
    model: 'gemini-3.8-flash',
    created_by: 'user-demo-123',
    created_at: new Date('2025-02-16T12:00:00Z').toISOString(),
    updated_at: new Date('2025-02-16T12:00:00Z').toISOString(),
  },
];

export class ComparisonRepository {
  private assetRepo: AssetRepository;

  constructor() {
    this.assetRepo = new AssetRepository();
  }

  private mapRowToRecord(row: any): ComparisonRecord {
    let result: ComparisonResult;
    if (typeof row.comparison_result === 'string') {
      try {
        result = JSON.parse(row.comparison_result);
      } catch {
        result = { summary: row.comparison_result, changes: [], overall_confidence: Number(row.confidence) || 0.8 };
      }
    } else {
      result = row.comparison_result;
    }

    return {
      id: row.id,
      project_id: row.project_id,
      before_asset_id: row.before_asset_id,
      after_asset_id: row.after_asset_id,
      comparison_result: result,
      confidence: Number(row.confidence),
      status: row.status || 'completed',
      model: row.model || 'gemini-3.8-flash',
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private async hydrateAssets(record: ComparisonRecord): Promise<ComparisonRecord> {
    const [beforeAsset, afterAsset] = await Promise.all([
      this.assetRepo.findById(record.before_asset_id),
      this.assetRepo.findById(record.after_asset_id),
    ]);

    return {
      ...record,
      before_asset: beforeAsset || null,
      after_asset: afterAsset || null,
    };
  }

  async create(data: {
    project_id: string;
    before_asset_id: string;
    after_asset_id: string;
    comparison_result: ComparisonResult;
    confidence: number;
    status?: 'completed' | 'inconclusive' | 'failed';
    model?: string;
    created_by?: string | null;
  }): Promise<ComparisonRecord> {
    const now = new Date().toISOString();
    const status = data.status || 'completed';
    const model = data.model || 'gemini-3.8-flash';

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from('comparisons')
          .insert({
            project_id: data.project_id,
            before_asset_id: data.before_asset_id,
            after_asset_id: data.after_asset_id,
            comparison_result: data.comparison_result,
            confidence: data.confidence,
            status,
            model,
            created_by: data.created_by || null,
            created_at: now,
            updated_at: now,
          })
          .select('*')
          .single();

        if (error) {
          console.error('[ComparisonRepository] Supabase insert error:', error.message);
          throw new Error(`Failed to save comparison to database: ${error.message}`);
        }

        const record = this.mapRowToRecord(inserted);
        return this.hydrateAssets(record);
      } catch (err: any) {
        console.warn('[ComparisonRepository] Supabase save error, persisting in mock store:', err.message);
      }
    }

    const newRecord: ComparisonRecord = {
      id: `comp-${randomUUID()}`,
      project_id: data.project_id,
      before_asset_id: data.before_asset_id,
      after_asset_id: data.after_asset_id,
      comparison_result: data.comparison_result,
      confidence: data.confidence,
      status,
      model,
      created_by: data.created_by || null,
      created_at: now,
      updated_at: now,
    };

    mockComparisonsStore.unshift(newRecord);
    return this.hydrateAssets(newRecord);
  }

  async findByPair(
    projectId: string,
    beforeAssetId: string,
    afterAssetId: string
  ): Promise<ComparisonRecord | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('comparisons')
          .select('*')
          .eq('project_id', projectId)
          .eq('before_asset_id', beforeAssetId)
          .eq('after_asset_id', afterAssetId)
          .maybeSingle();

        if (error) {
          console.warn('[ComparisonRepository] Supabase findByPair error:', error.message);
        } else if (data) {
          const record = this.mapRowToRecord(data);
          return this.hydrateAssets(record);
        }
      } catch (err: any) {
        console.warn('[ComparisonRepository] findByPair exception:', err.message);
      }
    }

    const found = mockComparisonsStore.find(
      (c) =>
        c.project_id === projectId &&
        c.before_asset_id === beforeAssetId &&
        c.after_asset_id === afterAssetId
    );

    if (!found) return null;
    return this.hydrateAssets(found);
  }

  async findByProjectId(projectId: string): Promise<ComparisonRecord[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('comparisons')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[ComparisonRepository] Supabase findByProjectId error:', error.message);
        } else if (data) {
          const records = data.map((d: any) => this.mapRowToRecord(d));
          return Promise.all(records.map((r) => this.hydrateAssets(r)));
        }
      } catch (err: any) {
        console.warn('[ComparisonRepository] findByProjectId exception:', err.message);
      }
    }

    const records = mockComparisonsStore
      .filter((c) => c.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return Promise.all(records.map((r) => this.hydrateAssets(r)));
  }

  async findById(id: string): Promise<ComparisonRecord | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('comparisons')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.warn('[ComparisonRepository] Supabase findById error:', error.message);
        } else if (data) {
          const record = this.mapRowToRecord(data);
          return this.hydrateAssets(record);
        }
      } catch (err: any) {
        console.warn('[ComparisonRepository] findById exception:', err.message);
      }
    }

    const found = mockComparisonsStore.find((c) => c.id === id);
    if (!found) return null;
    return this.hydrateAssets(found);
  }
}
