import { ProjectRepository } from '../repositories/project.repository.js';
import { Project, CreateProjectInput, UpdateProjectInput } from '../types/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class ProjectService {
  private projectRepository: ProjectRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
  }

  async getAllProjects(userId?: string): Promise<Project[]> {
    return this.projectRepository.findAll(userId);
  }

  async getProjectById(id: string, userId?: string): Promise<Project> {
    const project = await this.projectRepository.findById(id, userId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }
    return project;
  }

  async createProject(input: CreateProjectInput, userId?: string): Promise<Project> {
    if (!input.name || input.name.trim() === '') {
      throw new ValidationError('Project name is required');
    }
    const safeInput = {
      ...input,
      created_by: userId || input.created_by,
    };
    return this.projectRepository.create(safeInput, userId);
  }

  async updateProject(id: string, input: UpdateProjectInput, userId?: string): Promise<Project> {
    await this.getProjectById(id, userId); // Ensures project exists and belongs to user
    const updated = await this.projectRepository.update(id, input, userId);
    if (!updated) {
      throw new NotFoundError(`Failed to update project with ID ${id}`);
    }
    return updated;
  }

  async deleteProject(id: string, userId?: string): Promise<void> {
    await this.getProjectById(id, userId); // Ensures project exists and belongs to user
    const success = await this.projectRepository.delete(id, userId);
    if (!success) {
      throw new NotFoundError(`Failed to delete project with ID ${id}`);
    }
  }
}

