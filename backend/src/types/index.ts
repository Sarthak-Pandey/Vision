export interface Project {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  project_type?: ProjectType | string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  media_count?: number;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  project_type?: ProjectType | string;
  created_by?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  project_type?: ProjectType | string;
  created_by?: string;
  updated_at?: string;
}

export interface Asset {
  id: string;
  project_id: string;
  cloudinary_public_id?: string | null;
  url: string;
  type?: string | null;
  capture_date?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  uploaded_by?: string | null;
  created_at: string;
}

export interface CreateAssetInput {
  project_id: string;
  cloudinary_public_id?: string | null;
  url: string;
  type?: string | null;
  capture_date?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  uploaded_by?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}

export interface UserSession {
  id: string;
  email: string;
  name?: string;
}

export interface AiAnalysis {
  id: string;
  asset_id: string;
  description: string;
  objects: string[];
  activities: string[];
  scene: string;
  visible_condition: string;
  confidence: number;
  source?: 'gemini' | 'simulated';
  created_at: string;
}

export interface CreateAiAnalysisInput {
  asset_id: string;
  description: string;
  objects: string[];
  activities: string[];
  scene: string;
  visible_condition: string;
  confidence: number;
  source?: 'gemini' | 'simulated';
}

export interface EmbeddingRecord {
  id: string;
  asset_id: string;
  embedding: number[];
  model: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmbeddingInput {
  asset_id: string;
  embedding: number[];
  model?: string;
}

export interface SearchResult {
  asset_id: string;
  url: string;
  type: string;
  capture_date?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  project_id: string;
  similarity: number;
  activity?: string | null;
  description?: string | null;
}

export interface SemanticSearchParams {
  projectId: string;
  query: string;
  mediaType?: string;
  startDate?: string;
  endDate?: string;
  threshold?: number;
  limit?: number;
}

export interface IndexingStats {
  total: number;
  indexed: number;
  pending: number;
}

// ============================================================================
// Phase 5: Before / After Intelligence Types
// ============================================================================

export type ComparisonCategory =
  | 'vegetation'
  | 'waste'
  | 'water'
  | 'land'
  | 'infrastructure'
  | 'human_activity'
  | 'condition';

export type ComparisonDirection =
  | 'increase'
  | 'decrease'
  | 'new'
  | 'removed'
  | 'changed'
  | 'unchanged'
  | 'uncertain';

export interface ComparisonChange {
  description: string;
  category: ComparisonCategory;
  direction: ComparisonDirection;
  confidence: number;
}

export interface ComparisonResult {
  summary: string;
  changes: ComparisonChange[];
  overall_confidence: number;
}

export interface ComparisonRecord {
  id: string;
  project_id: string;
  before_asset_id: string;
  after_asset_id: string;
  comparison_result: ComparisonResult;
  confidence: number;
  status: 'completed' | 'inconclusive' | 'failed';
  model: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  before_asset?: Asset | null;
  after_asset?: Asset | null;
  compositeConfidence?: CompositeConfidence;
}

export interface CreateComparisonInput {
  beforeAssetId: string;
  afterAssetId: string;
}

// ============================================================================
// Phase 6: Evidence & Traceability Types
// ============================================================================

export type ClaimSourceType = 'asset_analysis' | 'comparison' | 'manual';

export interface EvidenceAsset {
  assetId: string;
  url: string;
  type: string;
  captureDate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  uploadedBy?: string | null;
  role?: 'evidence' | 'before' | 'after';
}

export interface EvidenceClaim {
  id: string;
  projectId: string;
  claim: string;
  confidence: number;
  sourceType: ClaimSourceType;
  sourceId?: string | null;
  category?: EvidenceCategory | null;
  normalizedClaim: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  evidence: EvidenceAsset[];
  compositeConfidence?: CompositeConfidence;
}

export interface CreateClaimInput {
  projectId: string;
  claim: string;
  confidence: number;
  sourceType: ClaimSourceType;
  sourceId?: string | null;
  category?: EvidenceCategory | null;
  evidenceAssetIds: string[];
  createdBy?: string | null;
}

export interface ClaimsTelemetry {
  totalClaims: number;
  evidenceBackedClaims: number;
  lowConfidenceClaims: number;
  analysisSourcesCount: number;
  comparisonSourcesCount: number;
  averageConfidence: number;
  averageCompositeConfidence?: number;
  highConfidenceClaims?: number;
  mediumConfidenceClaims?: number;
}

// ============================================================================
// Phase 7: Evidence Gap Detection Types
// ============================================================================

export type EvidenceCategory =
  | 'initial_condition'
  | 'activity'
  | 'immediate_result'
  | 'long_term_outcome'
  | 'beneficiary_evidence'
  | 'quantitative_measurement';

export type ProjectType =
  | 'tree_plantation'
  | 'river_restoration'
  | 'solar_installation'
  | 'waste_cleanup'
  | 'other';

export interface EvidenceCategorySource {
  assetId: string;
  url?: string;
  type?: string;
  captureDate?: string | null;
  claimId?: string;
  claimText?: string;
  sourceType?: string;
  role?: string;
}

export interface EvidenceCategoryStatus {
  category: EvidenceCategory;
  label: string;
  status: 'available' | 'missing';
  evidenceCount: number;
  sources: EvidenceCategorySource[];
  explanation: string;
  suggestedNextAction?: string;
}

export interface EvidenceGapReport {
  projectId: string;
  projectName: string;
  projectType: ProjectType;
  projectTypeConfigured: boolean;
  expected: EvidenceCategory[];
  available: EvidenceCategory[];
  missing: EvidenceCategory[];
  coverage: {
    available: number;
    expected: number;
    percentage: number;
  };
  categories: EvidenceCategoryStatus[];
  timestamp: string;
}

// ============================================================================
// Phase 8: Evidence Confidence System Types
// ============================================================================

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNAVAILABLE';

export interface ConfidenceSignals {
  visionConfidence?: number | null;
  metadataConsistency?: number | null;
  imageQuality?: number | null;
  crossAssetAgreement?: number | null;
  temporalConsistency?: number | null;
}

export interface ConfidenceBreakdownItem {
  name: string;
  weight: number;
  score: number | null;
  percentage: number | null;
  available: boolean;
  explanation?: string;
}

export interface CompositeConfidence {
  score: number | null;
  percentage: number | null;
  level: ConfidenceLevel;
  available: boolean;
  signals: ConfidenceSignals;
  breakdown: Record<keyof ConfidenceSignals, ConfidenceBreakdownItem>;
  evaluatedWeightsSum: number;
  disclaimer: string;
  explanation: string;
}

export interface ProjectConfidenceReport {
  projectId: string;
  projectName: string;
  averageCompositeConfidence: number | null;
  averageCompositePercentage: number | null;
  level: ConfidenceLevel;
  totalEvaluatedClaims: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
    unavailable: number;
  };
  signalsSummary: {
    visionConfidence: number | null;
    metadataConsistency: number | null;
    imageQuality: number | null;
    crossAssetAgreement: number | null;
    temporalConsistency: number | null;
  };
  disclaimer: string;
  timestamp: string;
}
