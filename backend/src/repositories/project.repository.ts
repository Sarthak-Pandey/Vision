import { supabase, isSupabaseConfigured } from '../config/database.js';
import { Project, CreateProjectInput, UpdateProjectInput } from '../types/index.js';
import { randomUUID } from 'crypto';
import { AssetRepository } from './asset.repository.js';

// In-memory fallback store for development when Supabase URL/Key is not set
const mockProjectsStore: Project[] = [
  {
    id: 'proj-1',
    name: 'Yamuna Restoration',
    description: 'Comprehensive riverbank clean-up, bio-remediation, and ecosystem restoration project.',
    location: 'Delhi',
    start_date: '2025-01-01',
    end_date: '2026-09-30',
    created_by: 'user-demo-123',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2025-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'proj-2',
    name: 'Green Village Solar Microgrid',
    description: 'Installation of 500kW solar panels and community distribution in rural villages.',
    location: 'Rajasthan',
    start_date: '2024-06-15',
    end_date: '2025-12-31',
    created_by: 'user-demo-123',
    created_at: new Date('2024-06-15T00:00:00Z').toISOString(),
    updated_at: new Date('2024-06-15T00:00:00Z').toISOString(),
  },
  {
    id: 'proj-3',
    name: 'Coastal Mangrove Plantation',
    description: 'Reforestation of 100 hectares of coastal mangrove forests for tidal wave protection.',
    location: 'Sundarbans, West Bengal',
    start_date: '2025-03-01',
    end_date: '2027-03-01',
    created_by: 'user-demo-456',
    created_at: new Date('2025-03-01T00:00:00Z').toISOString(),
    updated_at: new Date('2025-03-01T00:00:00Z').toISOString(),
  },
];

export class ProjectRepository {
  private assetRepository: AssetRepository;

  constructor() {
    this.assetRepository = new AssetRepository();
  }

  async findAll(userId?: string): Promise<Project[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('projects')
        .select('*, assets(count)');

      if (userId) {
        query = query.eq('created_by', userId);
      }

      let { data, error } = await query.order('created_at', { ascending: false });

      // Graceful fallback if database schema hasn't migrated created_by column yet
      if (error && error.code === '42703') {
        const retry = await supabase
          .from('projects')
          .select('*, assets(count)')
          .order('created_at', { ascending: false });
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      return (data || []).map((row: any) => {
        const { assets, ...projectData } = row;
        const count = Array.isArray(assets) && assets.length > 0 ? Number(assets[0].count || 0) : 0;
        return {
          ...projectData,
          media_count: count,
        } as Project;
      });
    }

    const allAssets = await this.assetRepository.findAll();
    const filteredMock = userId
      ? mockProjectsStore.filter((p) => p.created_by === userId)
      : [...mockProjectsStore];

    const result = filteredMock.map((p) => {
      const count = allAssets.filter((a) => a.project_id === p.id).length;
      return {
        ...p,
        media_count: count,
      };
    });

    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async findById(id: string, userId?: string): Promise<Project | null> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('projects')
        .select('*, assets(count)')
        .eq('id', id);

      if (userId) {
        query = query.eq('created_by', userId);
      }

      let { data, error } = await query.maybeSingle();

      // Graceful fallback if database schema hasn't migrated created_by column yet
      if (error && error.code === '42703') {
        const retry = await supabase
          .from('projects')
          .select('*, assets(count)')
          .eq('id', id)
          .maybeSingle();
        data = retry.data;
        error = retry.error;
      }

      if (error || !data) return null;
      const { assets, ...projectData } = data as any;
      const count = Array.isArray(assets) && assets.length > 0 ? Number(assets[0].count || 0) : 0;
      return {
        ...projectData,
        media_count: count,
      } as Project;
    }

    const project = mockProjectsStore.find(
      (p) => p.id === id && (!userId || p.created_by === userId)
    );
    if (!project) return null;

    const allAssets = await this.assetRepository.findAll();
    const count = allAssets.filter((a) => a.project_id === project.id).length;

    return {
      ...project,
      media_count: count,
    };
  }

  async create(input: CreateProjectInput, userId?: string): Promise<Project> {
    const nowIso = new Date().toISOString();
    const ownerId = userId || input.created_by || 'user-demo-123';

    if (isSupabaseConfigured() && supabase) {
      let { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: input.name,
            description: input.description || null,
            location: input.location || null,
            start_date: input.start_date || null,
            end_date: input.end_date || null,
            created_by: ownerId,
            updated_at: nowIso,
          },
        ])
        .select('*')
        .single();

      // Graceful fallback if database schema hasn't migrated created_by column yet
      if (error && (error.code === '42703' || error.message?.includes('created_by'))) {
        const retry = await supabase
          .from('projects')
          .insert([
            {
              name: input.name,
              description: input.description || null,
              location: input.location || null,
              start_date: input.start_date || null,
              end_date: input.end_date || null,
              updated_at: nowIso,
            },
          ])
          .select('*')
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        throw new Error(`Supabase create error: ${error.message}`);
      }
      return { ...data, media_count: 0 } as Project;
    }

    const newProject: Project = {
      id: `proj-${randomUUID()}`,
      name: input.name,
      description: input.description || null,
      location: input.location || null,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      created_by: ownerId,
      created_at: nowIso,
      updated_at: nowIso,
      media_count: 0,
    };

    mockProjectsStore.unshift(newProject);
    return newProject;
  }

  async update(id: string, input: UpdateProjectInput, userId?: string): Promise<Project | null> {
    // Exclude created_by modification from client updates
    const { created_by, ...safeFields } = input as any;

    const updateData = {
      ...safeFields,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('projects')
        .update(updateData)
        .eq('id', id);

      if (userId) {
        query = query.eq('created_by', userId);
      }

      let { data, error } = await query.select('*, assets(count)').maybeSingle();

      // Graceful fallback if database schema hasn't migrated created_by column yet
      if (error && (error.code === '42703' || error.message?.includes('created_by'))) {
        const retry = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', id)
          .select('*, assets(count)')
          .maybeSingle();
        data = retry.data;
        error = retry.error;
      }

      if (error || !data) return null;
      const { assets, ...projectData } = data as any;
      const count = Array.isArray(assets) && assets.length > 0 ? Number(assets[0].count || 0) : 0;
      return {
        ...projectData,
        media_count: count,
      } as Project;
    }

    const index = mockProjectsStore.findIndex(
      (p) => p.id === id && (!userId || p.created_by === userId)
    );
    if (index === -1) return null;

    mockProjectsStore[index] = {
      ...mockProjectsStore[index],
      ...updateData,
    };

    const allAssets = await this.assetRepository.findAll();
    const count = allAssets.filter((a) => a.project_id === id).length;

    return {
      ...mockProjectsStore[index],
      media_count: count,
    };
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('projects').delete().eq('id', id);
      if (userId) {
        query = query.eq('created_by', userId);
      }
      let { error } = await query;

      // Graceful fallback if database schema hasn't migrated created_by column yet
      if (error && (error.code === '42703' || error.message?.includes('created_by'))) {
        const retry = await supabase.from('projects').delete().eq('id', id);
        error = retry.error;
      }

      return !error;
    }

    const index = mockProjectsStore.findIndex(
      (p) => p.id === id && (!userId || p.created_by === userId)
    );
    if (index === -1) return false;
    mockProjectsStore.splice(index, 1);
    return true;
  }
}

