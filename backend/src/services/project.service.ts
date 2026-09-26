import { ProjectRepository } from '../repositories/project.repository.js';
import { Project, CreateProjectInput, UpdateProjectInput } from '../types/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class ProjectService {
  private projectRepository: ProjectRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
  }

  async getAllProjects(): Promise<Project[]> {
    return this.projectRepository.findAll();
  }

  async getProjectById(id: string): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }
    return project;
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    if (!input.name || input.name.trim() === '') {
      throw new ValidationError('Project name is required');
    }
    return this.projectRepository.create(input);
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    await this.getProjectById(id); // Ensures project exists
    const updated = await this.projectRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Failed to update project with ID ${id}`);
    }
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await this.getProjectById(id);
    const success = await this.projectRepository.delete(id);
    if (!success) {
      throw new NotFoundError(`Failed to delete project with ID ${id}`);
    }
  }
}
