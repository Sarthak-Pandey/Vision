import { Request, Response, NextFunction } from 'express';
import { ComparisonService } from '../services/comparison.service.js';
import { ValidationError } from '../utils/errors.js';

export class ComparisonController {
  private comparisonService: ComparisonService;

  constructor() {
    this.comparisonService = new ComparisonService();
  }

  createComparison = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { projectId } = req.params;

      if (!projectId || !projectId.trim()) {
        throw new ValidationError('Project ID is required in URL parameter');
      }

      // Do not trust any userId or createdBy provided in client payload; rely on server-side req.user
      const record = await this.comparisonService.compare(projectId, req.body, user?.id);

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  getProjectComparisons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { projectId } = req.params;

      if (!projectId || !projectId.trim()) {
        throw new ValidationError('Project ID is required in URL parameter');
      }

      const records = await this.comparisonService.getComparisonsByProject(projectId, user?.id);

      res.status(200).json({
        success: true,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  };

  getComparisonById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { projectId, id } = req.params;

      if (!projectId || !projectId.trim()) {
        throw new ValidationError('Project ID is required in URL parameter');
      }
      if (!id || !id.trim()) {
        throw new ValidationError('Comparison ID is required in URL parameter');
      }

      const record = await this.comparisonService.getComparisonById(id, projectId, user?.id);

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };
}
