import { Request, Response, NextFunction } from 'express';
import { EvidenceGapService } from '../services/evidence-gap.service.js';
import { ValidationError } from '../utils/errors.js';

export class EvidenceGapController {
  private evidenceGapService: EvidenceGapService;

  constructor() {
    this.evidenceGapService = new EvidenceGapService();
  }

  getEvidenceGaps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { projectId } = req.params;

      if (!projectId || !projectId.trim()) {
        throw new ValidationError('Project ID is required in URL parameter');
      }

      const report = await this.evidenceGapService.detectEvidenceGaps(projectId, user?.id);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };
}
