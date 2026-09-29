import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/search.service.js';

export class SearchController {
  private searchService: SearchService;

  constructor() {
    this.searchService = new SearchService();
  }

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const result = await this.searchService.search(req.body, user?.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  triggerIndexing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { projectId, batchSize } = req.body || {};
      const result = await this.searchService.backfill(
        projectId,
        user?.id,
        typeof batchSize === 'number' ? batchSize : 20
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getIndexingStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const projectId = req.query.projectId as string | undefined;
      if (!projectId || !projectId.trim()) {
        res.status(400).json({
          success: false,
          error: { message: 'Validation error: projectId query parameter is required' },
        });
        return;
      }
      const stats = await this.searchService.getIndexingStats(projectId.trim(), user?.id);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
