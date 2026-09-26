import {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
  MediaAsset,
  CreateAssetPayload,
  UploadMediaResponse,
  ApiResponse,
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

export async function getAssets(projectId?: string): Promise<MediaAsset[]> {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
  return request<MediaAsset[]>(`/assets${query}`);
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

