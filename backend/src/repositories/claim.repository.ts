import { supabase, isSupabaseConfigured } from '../config/database.js';
import {
  EvidenceClaim,
  EvidenceAsset,
  CreateClaimInput,
  ClaimsTelemetry,
  ClaimSourceType,
} from '../types/index.js';
import { AssetRepository } from './asset.repository.js';
import { randomUUID } from 'crypto';

interface MockClaimRecord {
  id: string;
  project_id: string;
  claim: string;
  confidence: number;
  source_type: ClaimSourceType;
  source_id?: string | null;
  normalized_claim: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

interface MockClaimEvidenceRecord {
  claim_id: string;
  asset_id: string;
  created_at: string;
}

// Initial mock seed data for offline / local demo testing on proj-1
const mockClaimsStore: MockClaimRecord[] = [
  {
    id: 'claim-seed-1',
    project_id: 'proj-1',
    claim: 'Tree plantation and ground stabilization activity observed along river corridor',
    confidence: 0.92,
    source_type: 'asset_analysis',
    source_id: 'ai-seed-1',
    normalized_claim: 'tree plantation and ground stabilization activity observed along river corridor',
    created_by: 'user-demo-123',
    created_at: new Date('2025-02-10T12:00:00Z').toISOString(),
    updated_at: new Date('2025-02-10T12:00:00Z').toISOString(),
  },
  {
    id: 'claim-seed-2',
    project_id: 'proj-1',
    claim: 'Increased visible green ground cover and stabilized soil embankment',
    confidence: 0.89,
    source_type: 'comparison',
    source_id: 'comp-seed-1',
    normalized_claim: 'increased visible green ground cover and stabilized soil embankment',
    created_by: 'user-demo-123',
    created_at: new Date('2025-02-16T12:00:00Z').toISOString(),
    updated_at: new Date('2025-02-16T12:00:00Z').toISOString(),
  },
];

const mockClaimEvidenceStore: MockClaimEvidenceRecord[] = [
  {
    claim_id: 'claim-seed-1',
    asset_id: 'asset-1',
    created_at: new Date('2025-02-10T12:00:00Z').toISOString(),
  },
  {
    claim_id: 'claim-seed-2',
    asset_id: 'asset-1',
    created_at: new Date('2025-02-16T12:00:00Z').toISOString(),
  },
  {
    claim_id: 'claim-seed-2',
    asset_id: 'asset-2',
    created_at: new Date('2025-02-16T12:00:00Z').toISOString(),
  },
];

export class ClaimRepository {
  private assetRepo: AssetRepository;

  constructor() {
    this.assetRepo = new AssetRepository();
  }

  private normalizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private async hydrateEvidence(
    claim: MockClaimRecord | any,
    evidenceRecords?: { asset_id: string; role?: string }[]
  ): Promise<EvidenceClaim> {
    let assetIds: string[] = [];

    if (evidenceRecords && evidenceRecords.length > 0) {
      assetIds = evidenceRecords.map((e) => e.asset_id);
    } else if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase
          .from('claim_evidence')
          .select('asset_id')
          .eq('claim_id', claim.id);
        assetIds = (data || []).map((row: any) => row.asset_id);
      } catch {
        assetIds = [];
      }
    } else {
      assetIds = mockClaimEvidenceStore
        .filter((e) => e.claim_id === claim.id)
        .map((e) => e.asset_id);
    }

    const assets = await Promise.all(assetIds.map((id) => this.assetRepo.findById(id)));

    const evidenceList: EvidenceAsset[] = assets.map((a, idx) => {
      if (!a) {
        return {
          assetId: assetIds[idx],
          url: '',
          type: 'image',
          role: 'evidence',
        };
      }

      let role: 'evidence' | 'before' | 'after' = 'evidence';
      if (claim.source_type === 'comparison') {
        role = idx === 0 ? 'before' : 'after';
      }

      return {
        assetId: a.id,
        url: a.url,
        type: a.type || 'image',
        captureDate: a.capture_date || null,
        latitude: a.latitude ? Number(a.latitude) : null,
        longitude: a.longitude ? Number(a.longitude) : null,
        uploadedBy: a.uploaded_by || null,
        role,
      };
    });

    return {
      id: claim.id,
      projectId: claim.project_id,
      claim: claim.claim,
      confidence: Number(claim.confidence),
      sourceType: claim.source_type as ClaimSourceType,
      sourceId: claim.source_id || null,
      normalizedClaim: claim.normalized_claim || this.normalizeText(claim.claim),
      createdBy: claim.created_by || null,
      createdAt: claim.created_at,
      updatedAt: claim.updated_at || claim.created_at,
      evidence: evidenceList,
    };
  }

  async findExistingClaim(
    projectId: string,
    sourceType: string,
    sourceId: string | null | undefined,
    normalizedClaim: string
  ): Promise<EvidenceClaim | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('evidence_claims')
          .select('*')
          .eq('project_id', projectId)
          .eq('source_type', sourceType)
          .eq('normalized_claim', normalizedClaim);

        if (sourceId) {
          query = query.eq('source_id', sourceId);
        }

        const { data, error } = await query.maybeSingle();
        if (error) {
          console.warn('[ClaimRepository] findExistingClaim query error:', error.message);
        } else if (data) {
          return this.hydrateEvidence(data);
        }
      } catch (err: any) {
        console.warn('[ClaimRepository] findExistingClaim exception:', err.message);
      }
    }

    const found = mockClaimsStore.find(
      (c) =>
        c.project_id === projectId &&
        c.source_type === sourceType &&
        (sourceId ? c.source_id === sourceId : true) &&
        c.normalized_claim === normalizedClaim
    );

    if (!found) return null;
    return this.hydrateEvidence(found);
  }

  async createClaim(input: CreateClaimInput): Promise<EvidenceClaim> {
    const now = new Date().toISOString();
    const normalized = this.normalizeText(input.claim);

    // 1. Check for duplicate claim in project for same source
    const existing = await this.findExistingClaim(
      input.projectId,
      input.sourceType,
      input.sourceId,
      normalized
    );
    if (existing) {
      // Ensure evidence links are present for all input asset IDs
      for (const assetId of input.evidenceAssetIds) {
        await this.addEvidence(existing.id, assetId);
      }
      return this.findById(existing.id) as Promise<EvidenceClaim>;
    }

    let claimId = `claim-${randomUUID()}`;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from('evidence_claims')
          .insert({
            project_id: input.projectId,
            claim: input.claim.trim(),
            confidence: input.confidence,
            source_type: input.sourceType,
            source_id: input.sourceId || null,
            normalized_claim: normalized,
            created_by: input.createdBy || null,
            created_at: now,
            updated_at: now,
          })
          .select('*')
          .single();

        if (error) {
          console.error('[ClaimRepository] Supabase insert error:', error.message);
          throw new Error(`Failed to save claim to database: ${error.message}`);
        }

        claimId = inserted.id;

        // Insert evidence links
        const links = input.evidenceAssetIds.map((assetId) => ({
          claim_id: claimId,
          asset_id: assetId,
          created_at: now,
        }));

        const { error: linkErr } = await supabase
          .from('claim_evidence')
          .upsert(links, { onConflict: 'claim_id,asset_id' });

        if (linkErr) {
          console.warn('[ClaimRepository] Supabase claim_evidence error:', linkErr.message);
        }

        return this.hydrateEvidence(inserted);
      } catch (err: any) {
        console.warn('[ClaimRepository] Supabase claim creation failed, using mock store:', err.message);
      }
    }

    const mockRecord: MockClaimRecord = {
      id: claimId,
      project_id: input.projectId,
      claim: input.claim.trim(),
      confidence: input.confidence,
      source_type: input.sourceType,
      source_id: input.sourceId || null,
      normalized_claim: normalized,
      created_by: input.createdBy || null,
      created_at: now,
      updated_at: now,
    };

    mockClaimsStore.unshift(mockRecord);

    for (const assetId of input.evidenceAssetIds) {
      const alreadyLinked = mockClaimEvidenceStore.some(
        (e) => e.claim_id === claimId && e.asset_id === assetId
      );
      if (!alreadyLinked) {
        mockClaimEvidenceStore.push({
          claim_id: claimId,
          asset_id: assetId,
          created_at: now,
        });
      }
    }

    return this.hydrateEvidence(mockRecord);
  }

  async addEvidence(claimId: string, assetId: string): Promise<void> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('claim_evidence')
          .upsert([{ claim_id: claimId, asset_id: assetId, created_at: now }], {
            onConflict: 'claim_id,asset_id',
          });
        return;
      } catch (err: any) {
        console.warn('[ClaimRepository] addEvidence Supabase error:', err.message);
      }
    }

    const exists = mockClaimEvidenceStore.some(
      (e) => e.claim_id === claimId && e.asset_id === assetId
    );
    if (!exists) {
      mockClaimEvidenceStore.push({ claim_id: claimId, asset_id: assetId, created_at: now });
    }
  }

  async findById(claimId: string): Promise<EvidenceClaim | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('evidence_claims')
          .select('*')
          .eq('id', claimId)
          .maybeSingle();

        if (error) {
          console.warn('[ClaimRepository] findById error:', error.message);
        } else if (data) {
          return this.hydrateEvidence(data);
        }
      } catch (err: any) {
        console.warn('[ClaimRepository] findById exception:', err.message);
      }
    }

    const found = mockClaimsStore.find((c) => c.id === claimId);
    if (!found) return null;
    return this.hydrateEvidence(found);
  }

  async findByProjectId(
    projectId: string,
    filters?: { sourceType?: string; minConfidence?: number }
  ): Promise<EvidenceClaim[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('evidence_claims')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (filters?.sourceType && filters.sourceType !== 'all') {
          query = query.eq('source_type', filters.sourceType);
        }
        if (typeof filters?.minConfidence === 'number') {
          query = query.gte('confidence', filters.minConfidence);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('[ClaimRepository] findByProjectId error:', error.message);
        } else if (data) {
          return Promise.all(data.map((row: any) => this.hydrateEvidence(row)));
        }
      } catch (err: any) {
        console.warn('[ClaimRepository] findByProjectId exception:', err.message);
      }
    }

    let records = mockClaimsStore.filter((c) => c.project_id === projectId);

    if (filters?.sourceType && filters.sourceType !== 'all') {
      records = records.filter((c) => c.source_type === filters.sourceType);
    }
    if (typeof filters?.minConfidence === 'number') {
      records = records.filter((c) => c.confidence >= filters.minConfidence!);
    }

    records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return Promise.all(records.map((r) => this.hydrateEvidence(r)));
  }

  async getClaimsForAsset(assetId: string): Promise<EvidenceClaim[]> {
    let claimIds: string[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase
          .from('claim_evidence')
          .select('claim_id')
          .eq('asset_id', assetId);
        claimIds = (data || []).map((row: any) => row.claim_id);
      } catch {
        claimIds = [];
      }
    } else {
      claimIds = mockClaimEvidenceStore
        .filter((e) => e.asset_id === assetId)
        .map((e) => e.claim_id);
    }

    const claims = await Promise.all(claimIds.map((id) => this.findById(id)));
    return claims.filter((c): c is EvidenceClaim => c !== null);
  }

  async getTelemetry(projectId: string): Promise<ClaimsTelemetry> {
    const claims = await this.findByProjectId(projectId);

    const totalClaims = claims.length;
    const evidenceBackedClaims = claims.filter(
      (c) => c.evidence.length > 0 && c.evidence.some((e) => e.url && e.url.trim() !== '')
    ).length;
    const lowConfidenceClaims = claims.filter((c) => c.confidence < 0.6).length;
    const analysisSourcesCount = claims.filter((c) => c.sourceType === 'asset_analysis').length;
    const comparisonSourcesCount = claims.filter((c) => c.sourceType === 'comparison').length;

    const totalConf = claims.reduce((sum, c) => sum + c.confidence, 0);
    const averageConfidence = totalClaims > 0 ? Number((totalConf / totalClaims).toFixed(2)) : 0;

    return {
      totalClaims,
      evidenceBackedClaims,
      lowConfidenceClaims,
      analysisSourcesCount,
      comparisonSourcesCount,
      averageConfidence,
    };
  }
}
