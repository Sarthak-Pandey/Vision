export interface Project {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
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
  created_by?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
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
}

export interface CreateComparisonPayload {
  beforeAssetId: string;
  afterAssetId: string;
}

