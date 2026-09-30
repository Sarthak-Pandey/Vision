import {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
  MediaAsset,
  MediaAssetWithAnalysis,
  CreateAssetPayload,
  UploadMediaResponse,
  AiAnalysis,
  ApiResponse,
  SearchResult,
  SemanticSearchParams,
  IndexingStats,
  ComparisonRecord,
  CreateComparisonPayload,
  EvidenceClaim,
  ClaimsTelemetry,
  ClaimSourceType,
  EvidenceGapReport,
  ProjectConfidenceReport,
  CompositeConfidence,
  ConfidenceSignals,
  ImpactReport,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'x-demo-user': 'true',
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMsg);
  }

  return json.data as T;
}

export async function getHealth(): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>('/health');
}

export async function getProjects(): Promise<Project[]> {
  return request<Project[]>('/projects');
}

export async function getProject(id: string): Promise<Project> {
  return request<Project>(`/projects/${id}`);
}

export async function createProject(data: CreateProjectPayload): Promise<Project> {
  return request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id: string, data: UpdateProjectPayload): Promise<Project> {
  return request<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  return request<void>(`/projects/${id}`, {
    method: 'DELETE',
  });
}

export async function getAssets(projectId?: string): Promise<MediaAssetWithAnalysis[]> {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
  return request<MediaAssetWithAnalysis[]>(`/assets${query}`);
}

export async function uploadMediaFile(file: File): Promise<UploadMediaResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/assets/upload`, {
    method: 'POST',
    headers: {
      'x-demo-user': 'true',
    },
    body: formData,
  });

  const json: ApiResponse<UploadMediaResponse> = await response.json();

  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `Upload failed with status: ${response.status}`;
    throw new Error(errorMsg);
  }

  return json.data as UploadMediaResponse;
}

export async function createAsset(data: CreateAssetPayload): Promise<MediaAsset> {
  return request<MediaAsset>('/assets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function analyzeAsset(assetId: string): Promise<AiAnalysis> {
  return request<AiAnalysis>(`/assets/${assetId}/analyze`, {
    method: 'POST',
  });
}

export async function getAssetAnalysis(assetId: string): Promise<AiAnalysis | null> {
  return request<AiAnalysis | null>(`/assets/${assetId}/analysis`);
}

export async function semanticSearch(
  params: SemanticSearchParams
): Promise<{ results: SearchResult[]; total: number; query: string; threshold: number }> {
  return request<{ results: SearchResult[]; total: number; query: string; threshold: number }>('/search', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getIndexingStats(projectId: string): Promise<IndexingStats> {
  const query = `?projectId=${encodeURIComponent(projectId)}`;
  return request<IndexingStats>(`/search/stats${query}`);
}

export async function triggerIndexing(
  projectId: string,
  batchSize?: number
): Promise<{ processed: number; successful: number; failed: number; pending: number }> {
  return request<{ processed: number; successful: number; failed: number; pending: number }>('/search/index', {
    method: 'POST',
    body: JSON.stringify({ projectId, batchSize }),
  });
}

// ============================================================================
// Phase 5: Before / After Intelligence Client API
// ============================================================================

export async function createComparison(
  projectId: string,
  payload: CreateComparisonPayload
): Promise<ComparisonRecord> {
  return request<ComparisonRecord>(`/projects/${projectId}/comparisons`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getProjectComparisons(
  projectId: string
): Promise<ComparisonRecord[]> {
  return request<ComparisonRecord[]>(`/projects/${projectId}/comparisons`);
}

export async function getComparisonById(
  projectId: string,
  comparisonId: string
): Promise<ComparisonRecord> {
  return request<ComparisonRecord>(`/projects/${projectId}/comparisons/${comparisonId}`);
}

// ============================================================================
// Phase 6: Evidence & Traceability Client API
// ============================================================================

export interface GetClaimsFilters {
  sourceType?: ClaimSourceType;
  minConfidence?: number;
  limit?: number;
  offset?: number;
}

export interface GetClaimsResponse {
  claims: EvidenceClaim[];
  telemetry: ClaimsTelemetry;
}

export async function getProjectClaims(
  projectId: string,
  filters?: GetClaimsFilters
): Promise<GetClaimsResponse> {
  const queryParams = new URLSearchParams();
  if (filters?.sourceType) queryParams.set('sourceType', filters.sourceType);
  if (filters?.minConfidence !== undefined) queryParams.set('minConfidence', String(filters.minConfidence));
  if (filters?.limit) queryParams.set('limit', String(filters.limit));
  if (filters?.offset) queryParams.set('offset', String(filters.offset));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return request<GetClaimsResponse>(`/projects/${projectId}/claims${query}`);
}

export async function getClaimById(
  projectId: string,
  claimId: string
): Promise<EvidenceClaim> {
  return request<EvidenceClaim>(`/projects/${projectId}/claims/${claimId}`);
}

export async function syncProjectClaims(
  projectId: string
): Promise<{ syncedClaims: number; claims: EvidenceClaim[] }> {
  return request<{ syncedClaims: number; claims: EvidenceClaim[] }>(
    `/projects/${projectId}/claims/sync`,
    {
      method: 'POST',
    }
  );
}

// ============================================================================
// Phase 7: Evidence Gap Detection Client API
// ============================================================================

export async function getEvidenceGaps(
  projectId: string
): Promise<EvidenceGapReport> {
  return request<EvidenceGapReport>(`/projects/${projectId}/evidence-gaps`);
}

// ============================================================================
// Phase 8: Evidence Confidence System Client API
// ============================================================================

export async function getProjectConfidence(
  projectId: string
): Promise<ProjectConfidenceReport> {
  return request<ProjectConfidenceReport>(`/projects/${projectId}/confidence`);
}

export async function calculateConfidence(
  projectId: string,
  signals: ConfidenceSignals
): Promise<CompositeConfidence> {
  return request<CompositeConfidence>(`/projects/${projectId}/confidence/calculate`, {
    method: 'POST',
    body: JSON.stringify({ signals }),
  });
}

// ============================================================================
// Phase 9: Project Impact Report Client API
// ============================================================================

export async function getProjectImpactReport(
  projectId: string
): Promise<ImpactReport> {
  return request<ImpactReport>(`/projects/${projectId}/report`);
}



