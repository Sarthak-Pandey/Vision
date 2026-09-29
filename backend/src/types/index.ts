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

export interface CreateProjectInput {
  name: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  created_by?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
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
