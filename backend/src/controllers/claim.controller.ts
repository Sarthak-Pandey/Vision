import { Request, Response, NextFunction } from 'express';
import { ClaimService } from '../services/claim.service.js';
import { ValidationError } from '../utils/errors.js';

export class ClaimController {
  private claimService: ClaimService;

  constructor() {
    this.claimService = new ClaimService();
  }

  getClaims = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { projectId } = req.params;

      if (!projectId || !projectId.trim()) {
        throw new ValidationError('Project ID is required in URL parameter');
      }

      const result = await this.claimService.getClaims(
        projectId,
        req.query as any,
        user?.id
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getClaimById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { projectId, claimId } = req.params;

      if (!projectId || !projectId.trim()) {
        throw new ValidationError('Project ID is required in URL parameter');
      }
      if (!claimId || !claimId.trim()) {
        throw new ValidationError('Claim ID is required in URL parameter');
      }

      const claim = await this.claimService.getClaimById(projectId, claimId, user?.id);

      res.status(200).json({
        success: true,
        data: claim,
      });
    } catch (error) {
      next(error);
    }
  };

  syncClaims = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { projectId } = req.params;

      if (!projectId || !projectId.trim()) {
        throw new ValidationError('Project ID is required in URL parameter');
      }

      const result = await this.claimService.syncProjectClaims(projectId, user?.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  createClaim = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { projectId } = req.params;

      if (!projectId || !projectId.trim()) {
        throw new ValidationError('Project ID is required in URL parameter');
      }

      // Enforce server-side user identity; client-supplied createdBy/userId is ignored
      const claim = await this.claimService.createClaim(projectId, req.body, user?.id);

      res.status(201).json({
        success: true,
        data: claim,
      });
    } catch (error) {
      next(error);
    }
  };
}
