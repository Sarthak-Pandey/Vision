import { Request, Response, NextFunction } from 'express';
import { AssetService } from '../services/asset.service.js';
import { CloudinaryService } from '../services/cloudinary.service.js';
import { VisionService } from '../services/vision.service.js';
import { ProjectService } from '../services/project.service.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { Asset, AiAnalysis } from '../types/index.js';

export class AssetController {
  private assetService: AssetService;
  private cloudinaryService: CloudinaryService;
  private visionService: VisionService;
  private projectService: ProjectService;

  constructor() {
    this.assetService = new AssetService();
    this.cloudinaryService = new CloudinaryService();
    this.visionService = new VisionService();
    this.projectService = new ProjectService();
  }

  getAssets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { projectId } = req.query;
      let assets: Asset[] = [];

      if (projectId && typeof projectId === 'string') {
        // Enforce user ownership of target project
        await this.projectService.getProjectById(projectId, userId);
        assets = await this.assetService.getAssetsByProject(projectId);
      } else {
        // Fetch only assets belonging to user's authorized projects
        const userProjects = await this.projectService.getAllProjects(userId);
        const userProjectIds = userProjects.map((p) => p.id);
        assets = await this.assetService.getAssetsByProjectIds(userProjectIds);
      }

      // Efficiently fetch only the latest AI analysis for the requested asset IDs
      const assetIds = assets.map((a) => a.id);
      const analysisMap = await this.visionService.getLatestAnalysesForAssets(assetIds);

      const enrichedAssets = assets.map((asset) => ({
        ...asset,
        ai_analysis: analysisMap.get(asset.id) || null,
      }));

      res.status(200).json({
        success: true,
        data: enrichedAssets,
      });
    } catch (error) {
      next(error);
    }
  };

  createAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name || (req as any).user?.email || 'Field Worker';

      // Verify user owns target project before associating asset
      const project = await this.projectService.getProjectById(req.body.project_id, userId);

      const assetPayload = {
        ...req.body,
        uploaded_by: userName,
      };

      const asset = await this.assetService.createAsset(assetPayload);

      // Trigger automated vision analysis in background upon asset registration
      (async () => {
        try {
          await this.visionService.analyzeAsset(asset, project.name);
          console.log(`[AssetController] Automated AI Vision analysis completed for asset: ${asset.id}`);
        } catch (visionErr: any) {
          console.warn(`[AssetController] Background vision analysis failed for asset ${asset.id}:`, visionErr.message);
        }
      })();

      res.status(201).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };

  analyzeAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      const asset = await this.assetService.getAssetById(id);
      if (!asset) {
        throw new NotFoundError(`Asset with ID ${id} not found`);
      }

      // Verify user owns the project containing this asset
      const project = await this.projectService.getProjectById(asset.project_id, userId);

      const analysis = await this.visionService.analyzeAsset(asset, project.name);
      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  };

  getAssetAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      const asset = await this.assetService.getAssetById(id);
      if (!asset) {
        throw new NotFoundError(`Asset with ID ${id} not found`);
      }

      // Verify user owns the project containing this asset
      await this.projectService.getProjectById(asset.project_id, userId);

      const analysis = await this.visionService.getAnalysisByAssetId(id);
      res.status(200).json({
        success: true,
        data: analysis,
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
