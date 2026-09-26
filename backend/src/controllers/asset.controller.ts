import { Request, Response, NextFunction } from 'express';
import { AssetService } from '../services/asset.service.js';

export class AssetController {
  private assetService: AssetService;

  constructor() {
    this.assetService = new AssetService();
  }

  getAssets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.query;
      let assets;
      if (projectId && typeof projectId === 'string') {
        assets = await this.assetService.getAssetsByProject(projectId);
      } else {
        assets = await this.assetService.getAllAssets();
      }

      res.status(200).json({
        success: true,
        data: assets,
      });
    } catch (error) {
      next(error);
    }
  };
}
