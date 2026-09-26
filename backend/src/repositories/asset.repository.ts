import { supabase, isSupabaseConfigured } from '../config/database.js';
import { Asset } from '../types/index.js';

const mockAssetsStore: Asset[] = [
  {
    id: 'asset-1',
    project_id: 'proj-1',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=60',
    type: 'image',
    capture_date: '2025-02-10T10:00:00Z',
    latitude: 28.6139,
    longitude: 77.209,
    uploaded_by: 'Sarthak Pandey',
    created_at: new Date('2025-02-10T10:00:00Z').toISOString(),
  },
  {
    id: 'asset-2',
    project_id: 'proj-1',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=60',
    type: 'image',
    capture_date: '2025-02-15T14:30:00Z',
    latitude: 28.6145,
    longitude: 77.2095,
    uploaded_by: 'Sarthak Pandey',
    created_at: new Date('2025-02-15T14:30:00Z').toISOString(),
  },
  {
    id: 'asset-3',
    project_id: 'proj-2',
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
}
