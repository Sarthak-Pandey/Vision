import { Request, Response, NextFunction } from 'express';
import { AssetService } from '../services/asset.service.js';
import { CloudinaryService } from '../services/cloudinary.service.js';
import { BadRequestError } from '../utils/errors.js';

export class AssetController {
  private assetService: AssetService;
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.assetService = new AssetService();
    this.cloudinaryService = new CloudinaryService();
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

  createAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const asset = await this.assetService.createAsset(req.body);
      res.status(201).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };

  uploadMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('No media file provided for upload');
      }

      const result = await this.cloudinaryService.uploadFile(req.file);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getUploadSignature = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const folder = (req.query.folder as string) || 'ai-impact-evidence';
      const signatureData = await this.cloudinaryService.generateUploadSignature(folder);
      res.status(200).json({
        success: true,
        data: signatureData,
      });
    } catch (error) {
      next(error);
    }
  };
}

