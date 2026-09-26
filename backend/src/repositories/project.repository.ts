import { supabase, isSupabaseConfigured } from '../config/database.js';
import { Project, CreateProjectInput, UpdateProjectInput } from '../types/index.js';
import { randomUUID } from 'crypto';

// In-memory fallback store for development when Supabase URL/Key is not set
const mockProjectsStore: Project[] = [
  {
    id: 'proj-1',
    name: 'Yamuna Restoration',
    description: 'Comprehensive riverbank clean-up, bio-remediation, and ecosystem restoration project.',
    location: 'Delhi',
    start_date: '2025-01-01',
    end_date: '2026-09-30',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'proj-2',
    name: 'Green Village Solar Microgrid',
    description: 'Installation of 500kW solar panels and community distribution in rural villages.',
    location: 'Rajasthan',
    start_date: '2024-06-15',
    end_date: '2025-12-31',
    created_at: new Date('2024-06-15T00:00:00Z').toISOString(),
  },
  {
    id: 'proj-3',
    name: 'Coastal Mangrove Plantation',
    description: 'Reforestation of 100 hectares of coastal mangrove forests for tidal wave protection.',
    location: 'Sundarbans, West Bengal',
    start_date: '2025-03-01',
    end_date: '2027-03-01',
    created_at: new Date('2025-03-01T00:00:00Z').toISOString(),
  },
];

export class ProjectRepository {
  async findAll(): Promise<Project[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      return data as Project[];
    }

    return [...mockProjectsStore].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async findById(id: string): Promise<Project | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return data as Project;
    }

    return mockProjectsStore.find((p) => p.id === id) || null;
  }

  async create(input: CreateProjectInput): Promise<Project> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: input.name,
            description: input.description || null,
            location: input.location || null,
            start_date: input.start_date || null,
            end_date: input.end_date || null,
          },
        ])
        .select('*')
        .single();

      if (error) {
        throw new Error(`Supabase create error: ${error.message}`);
      }
      return data as Project;
    }

    const newProject: Project = {
      id: `proj-${randomUUID()}`,
      name: input.name,
      description: input.description || null,
      location: input.location || null,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      created_at: new Date().toISOString(),
    };

    mockProjectsStore.unshift(newProject);
    return newProject;
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .update(input)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) return null;
      return data as Project;
    }

    const index = mockProjectsStore.findIndex((p) => p.id === id);
    if (index === -1) return null;

    mockProjectsStore[index] = {
      ...mockProjectsStore[index],
      ...input,
    };

    return mockProjectsStore[index];
  }

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      return !error;
    }

    const index = mockProjectsStore.findIndex((p) => p.id === id);
    if (index === -1) return false;
    mockProjectsStore.splice(index, 1);
    return true;
  }
}
