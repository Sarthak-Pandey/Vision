import { Request, Response, NextFunction } from 'express';
import { ImpactReportService } from '../services/report.service.js';
import { ValidationError } from '../utils/errors.js';

export class ImpactReportController {
  private reportService: ImpactReportService;

  constructor() {
    this.reportService = new ImpactReportService();
  }

  getProjectReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { projectId } = req.params;

      if (!projectId || !projectId.trim()) {
        throw new ValidationError('Project ID is required in URL parameter');
      }

      const report = await this.reportService.generateProjectReport(projectId, user?.id);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };
}
