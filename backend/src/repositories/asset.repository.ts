import { supabase, isSupabaseConfigured } from '../config/database.js';
import { Asset, CreateAssetInput } from '../types/index.js';

const mockAssetsStore: Asset[] = [
  {
    id: 'asset-1',
    project_id: 'proj-1',
    cloudinary_public_id: 'sample_tree_1',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=60',
    type: 'image',
    capture_date: '2025-02-10T10:00:00Z',
    latitude: 28.6139,
    longitude: 77.209,
    uploaded_by: 'Field Analyst',
    created_at: new Date('2025-02-10T10:00:00Z').toISOString(),
  },
  {
    id: 'asset-2',
    project_id: 'proj-1',
    cloudinary_public_id: 'sample_tree_2',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=60',
    type: 'image',
    capture_date: '2025-02-15T14:30:00Z',
    latitude: 28.6145,
    longitude: 77.2095,
    uploaded_by: 'Field Analyst',
    created_at: new Date('2025-02-15T14:30:00Z').toISOString(),
  },
  {
    id: 'asset-3',
    project_id: 'proj-2',
    cloudinary_public_id: 'sample_solar_1',
    url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=60',
    type: 'image',
    capture_date: '2025-01-20T09:15:00Z',
    latitude: 26.9124,
    longitude: 75.7873,
    uploaded_by: 'Field Analyst',
    created_at: new Date('2025-01-20T09:15:00Z').toISOString(),
  },
];

export class AssetRepository {
  async findByProjectId(projectId: string): Promise<Asset[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data as Asset[];
    }

    return mockAssetsStore.filter((a) => a.project_id === projectId);
  }

  async findById(id: string): Promise<Asset | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return (data as Asset) || null;
    }

    return mockAssetsStore.find((a) => a.id === id) || null;
  }

  async findByProjectIds(projectIds: string[]): Promise<Asset[]> {
    if (!projectIds || projectIds.length === 0) return [];

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data as Asset[];
    }

    return mockAssetsStore.filter((a) => projectIds.includes(a.project_id));
  }

  async findAll(): Promise<Asset[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data as Asset[];
    }

    return mockAssetsStore;
  }

  async create(data: CreateAssetInput): Promise<Asset> {
    if (isSupabaseConfigured() && supabase) {
      const { data: created, error } = await supabase
        .from('assets')
        .insert([
          {
            project_id: data.project_id,
            cloudinary_public_id: data.cloudinary_public_id || null,
            url: data.url,
            type: data.type || 'image',
            capture_date: data.capture_date || new Date().toISOString(),
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            uploaded_by: data.uploaded_by || 'Anonymous Field Worker',
          },
        ])
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return created as Asset;
    }

    const newAsset: Asset = {
      id: `ast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      project_id: data.project_id,
      cloudinary_public_id: data.cloudinary_public_id || null,
      url: data.url,
      type: data.type || 'image',
      capture_date: data.capture_date || new Date().toISOString(),
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      uploaded_by: data.uploaded_by || 'Field Analyst',
      created_at: new Date().toISOString(),
    };

    mockAssetsStore.unshift(newAsset);
    return newAsset;
  }
}

