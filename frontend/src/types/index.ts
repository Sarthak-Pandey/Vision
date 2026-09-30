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

export interface CreateProjectPayload {
  name: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  project_type?: ProjectType | string;
  created_by?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  project_type?: ProjectType | string;
  created_by?: string;
  updated_at?: string;
}

export interface ActivitySummaryItem {
  activity: string;
  normalizedKey: string;
  count: number;
}

export interface TimelineMonthGroup {
  monthName: string;
  monthKey: string;
  count: number;
  assets: MediaAssetWithAnalysis[];
}

export interface TimelineYearGroup {
  year: string;
  totalAssets: number;
  months: TimelineMonthGroup[];
}

export interface LocationClusterItem {
  key: string;
  latitude: number;
  longitude: number;
  formattedCoordinates: string;
  count: number;
  sampleAssetUrl?: string;
}

export interface ProjectStatsSummary {
  mediaCount: number;
  activityCount: number;
  locationCount: number;
  activities: ActivitySummaryItem[];
  timeline: TimelineYearGroup[];
  locations: LocationClusterItem[];
  undatedAssetsCount: number;
}

export interface MediaAsset {
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

export interface CreateAssetPayload {
  project_id: string;
  cloudinary_public_id?: string | null;
  url: string;
  type?: string | null;
  capture_date?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  uploaded_by?: string | null;
}

export interface UploadMediaResponse {
  url: string;
  public_id: string;
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

export interface MediaAssetWithAnalysis extends MediaAsset {
  ai_analysis?: AiAnalysis | null;
}


export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  isGuest?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
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
  before_asset?: MediaAsset | null;
  after_asset?: MediaAsset | null;
  compositeConfidence?: CompositeConfidence;
}

export interface CreateComparisonPayload {
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

// ============================================================================
// Phase 9: Project Impact Report Types
// ============================================================================

export interface ReportProjectOverview {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  projectType: string;
  createdDate: string;
  mediaCount: number;
}

export interface ReportTimelineMonth {
  monthName: string;
  monthKey: string;
  count: number;
}

export interface ReportTimelineYear {
  year: string;
  totalAssets: number;
  months: ReportTimelineMonth[];
}

export interface ReportTimelineSection {
  timeline: ReportTimelineYear[];
  undatedAssetsCount: number;
  totalDatedAssets: number;
}

export interface ReportActivityItem {
  activity: string;
  normalizedKey: string;
  assetCount: number;
}

export interface ReportActivitySection {
  activities: ReportActivityItem[];
  totalActivitiesCount: number;
  mediaWithActivitiesCount: number;
}

export interface ReportLocationCluster {
  key: string;
  latitude: number;
  longitude: number;
  formattedCoordinates: string;
  assetCount: number;
  sampleAssetUrl?: string;
}

export interface ReportLocationSection {
  locationsCount: number;
  locations: ReportLocationCluster[];
  summaryText: string;
}

export interface ReportObservedChange {
  description: string;
  category: ComparisonCategory;
  direction: ComparisonDirection;
  confidence: number;
  comparisonId: string;
  occurrences: number;
  supportingComparisonIds: string[];
}

export interface ReportComparisonItem {
  id: string;
  beforeAssetId: string;
  afterAssetId: string;
  beforeAssetUrl: string;
  afterAssetUrl: string;
  beforeCaptureDate: string | null;
  afterCaptureDate: string | null;
  summary: string;
  confidence: number;
  compositeConfidence?: CompositeConfidence;
  changes: ComparisonChange[];
}

export interface ReportBeforeAfterSection {
  comparisonsCount: number;
  comparisons: ReportComparisonItem[];
}

export interface ReportEvidenceQualitySection {
  compositeConfidence: number | null;
  compositePercentage: number | null;
  confidenceLevel: ConfidenceLevel;
  signalsSummary: {
    visionConfidence: number | null;
    metadataConsistency: number | null;
    imageQuality: number | null;
    crossAssetAgreement: number | null;
    temporalConsistency: number | null;
  };
  totalClaims: number;
  evidenceBackedClaimsCount: number;
  claimsWithoutEvidenceCount: number;
  disclaimer: string;
}

export interface ReportEvidenceGapsSection {
  projectType: ProjectType;
  projectTypeConfigured: boolean;
  expectedCategories: EvidenceCategory[];
  availableCategories: EvidenceCategory[];
  missingCategories: EvidenceCategory[];
  coveragePercentage: number;
  categories: EvidenceCategoryStatus[];
}

export interface ReportSourceAsset {
  id: string;
  url: string;
  type: string;
  captureDate: string | null;
  latitude: number | null;
  longitude: number | null;
  activities: string[];
  supportingClaims: { id: string; claim: string; confidence: number }[];
  usedInComparisons: { id: string; role: 'before' | 'after' }[];
}

export interface ImpactReport {
  project: ReportProjectOverview;
  timeline: ReportTimelineSection;
  activities: ReportActivitySection;
  locations: ReportLocationSection;
  beforeAfter: ReportBeforeAfterSection;
  observedChanges: ReportObservedChange[];
  evidenceQuality: ReportEvidenceQualitySection;
  evidenceGaps: ReportEvidenceGapsSection;
  sourceAssets: ReportSourceAsset[];
  generatedAt: string;
}

