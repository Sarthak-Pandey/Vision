import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service.js';

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const projects = await this.projectService.getAllProjects(userId);
      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };

  getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const project = await this.projectService.getProjectById(id, userId);
      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      // Strip any client-supplied created_by to prevent ownership spoofing
      const { created_by, ...inputData } = req.body;
      const project = await this.projectService.createProject(inputData, userId);
      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      // Strip any client-supplied created_by
      const { created_by, ...inputData } = req.body;
      const project = await this.projectService.updateProject(id, inputData, userId);
      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      await this.projectService.deleteProject(id, userId);
      res.status(200).json({
        success: true,
        data: { message: 'Project deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  };
}

