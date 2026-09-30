import { Request, Response, NextFunction } from 'express';
import { ClaimService } from '../services/claim.service.js';
import { ConfidenceService } from '../services/confidence.service.js';
import { ValidationError } from '../utils/errors.js';

export class ConfidenceController {
  private claimService: ClaimService;
  private confidenceService: ConfidenceService;

  constructor() {
    this.claimService = new ClaimService();
    this.confidenceService = new ConfidenceService();
  }

  getConfidenceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { projectId } = req.params;

      if (!projectId || !projectId.trim()) {
        throw new ValidationError('Project ID is required in URL parameter');
      }

      const report = await this.claimService.getProjectConfidenceReport(projectId, user?.id);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

  calculateConfidence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { projectId } = req.params;
      const { signals } = req.body;

      if (!projectId || !projectId.trim()) {
        throw new ValidationError('Project ID is required in URL parameter');
      }

      if (!signals || typeof signals !== 'object') {
        throw new ValidationError('signals object is required in request body');
      }

      // Authorize project ownership
      await this.claimService.getProjectConfidenceReport(projectId, user?.id);

      const result = this.confidenceService.calculate(signals);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
