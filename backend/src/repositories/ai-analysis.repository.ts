import { supabase, isSupabaseConfigured } from '../config/database.js';
import { AiAnalysis, CreateAiAnalysisInput } from '../types/index.js';

const mockAiAnalysisStore: AiAnalysis[] = [];

function mapRowToAiAnalysis(row: any): AiAnalysis {
  const isExplicitlySimulated =
    row.source === 'simulated' ||
    (typeof row.description === 'string' && row.description.startsWith('[Simulated'));

  return {
    ...row,
    objects: Array.isArray(row.objects) ? row.objects : JSON.parse(row.objects || '[]'),
    activities: Array.isArray(row.activities) ? row.activities : JSON.parse(row.activities || '[]'),
    confidence: Number(row.confidence),
    source: isExplicitlySimulated ? 'simulated' : (row.source || 'gemini'),
  } as AiAnalysis;
}

export class AiAnalysisRepository {
  async findByAssetId(assetId: string): Promise<AiAnalysis | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('ai_analysis')
          .select('*')
          .eq('asset_id', assetId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('[AiAnalysisRepository] Supabase find error, falling back:', error.message);
          return mockAiAnalysisStore.find((a) => a.asset_id === assetId) || null;
        }

        if (data) {
          return mapRowToAiAnalysis(data);
        }
      } catch (err: any) {
        console.warn('[AiAnalysisRepository] findByAssetId exception:', err.message);
      }
    }

    return mockAiAnalysisStore.find((a) => a.asset_id === assetId) || null;
  }

  async findLatestByAssetIds(assetIds: string[]): Promise<Map<string, AiAnalysis>> {
    const map = new Map<string, AiAnalysis>();
    if (!assetIds || assetIds.length === 0) return map;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('ai_analysis')
          .select('*')
          .in('asset_id', assetIds)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[AiAnalysisRepository] Supabase findLatestByAssetIds error, falling back:', error.message);
        } else if (data) {
          for (const item of data) {
            // First item encountered per asset_id is the latest due to DESC ordering
            if (!map.has(item.asset_id)) {
              map.set(item.asset_id, mapRowToAiAnalysis(item));
            }
          }
          return map;
        }
      } catch (err: any) {
        console.warn('[AiAnalysisRepository] findLatestByAssetIds exception:', err.message);
      }
    }

    for (const a of mockAiAnalysisStore) {
      if (assetIds.includes(a.asset_id) && !map.has(a.asset_id)) {
        map.set(a.asset_id, a);
      }
    }

    return map;
  }

  async findAll(): Promise<AiAnalysis[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('ai_analysis')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[AiAnalysisRepository] Supabase findAll error, falling back:', error.message);
          return mockAiAnalysisStore;
        }

        return (data || []).map(mapRowToAiAnalysis);
      } catch (err: any) {
        console.warn('[AiAnalysisRepository] findAll exception:', err.message);
      }
    }

    return mockAiAnalysisStore;
  }

  async create(data: CreateAiAnalysisInput): Promise<AiAnalysis> {
    const payloadWithSource = {
      asset_id: data.asset_id,
      description: data.description,
      objects: data.objects,
      activities: data.activities,
      scene: data.scene,
      visible_condition: data.visible_condition,
      confidence: data.confidence,
      source: data.source || 'gemini',
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        let { data: created, error } = await supabase
          .from('ai_analysis')
          .insert([payloadWithSource])
          .select('*')
          .single();

        // If table doesn't have source column yet, preserve provenance via compatible storage path
        if (error && error.message.includes('source')) {
          console.warn('[AiAnalysisRepository] Table lacks source column, preserving provenance in legacy schema:', error.message);
          const legacyPayload = {
            asset_id: data.asset_id,
            description:
              data.source === 'simulated' && !data.description.startsWith('[Simulated')
                ? `[Simulated] ${data.description}`
                : data.description,
            objects: data.objects,
            activities: data.activities,
            scene: data.scene,
            visible_condition: data.visible_condition,
            confidence: data.confidence,
          };
          const retry = await supabase
            .from('ai_analysis')
            .insert([legacyPayload])
            .select('*')
            .single();
          created = retry.data;
          error = retry.error;
        }

        if (error) {
          console.warn('[AiAnalysisRepository] Supabase insert error, saving to in-memory store:', error.message);
        } else if (created) {
          return mapRowToAiAnalysis(created);
        }
      } catch (err: any) {
        console.warn('[AiAnalysisRepository] create exception:', err.message);
      }
    }

    const newAnalysis: AiAnalysis = {
      id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      asset_id: data.asset_id,
      description: data.description,
      objects: data.objects,
      activities: data.activities,
      scene: data.scene,
      visible_condition: data.visible_condition,
      confidence: data.confidence,
      source: data.source || 'gemini',
      created_at: new Date().toISOString(),
    };

    mockAiAnalysisStore.unshift(newAnalysis);
    return newAnalysis;
  }
}
