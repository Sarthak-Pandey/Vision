export interface Project {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
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
