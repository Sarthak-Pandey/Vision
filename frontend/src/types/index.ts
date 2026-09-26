export interface Project {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
}

export interface MediaAsset {
  id: string;
  project_id: string;
  url: string;
  type?: string | null;
  capture_date?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  uploaded_by?: string | null;
  created_at: string;
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
