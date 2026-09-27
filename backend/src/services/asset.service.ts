import { AssetRepository } from '../repositories/asset.repository.js';
import { Asset, CreateAssetInput } from '../types/index.js';

export class AssetService {
  private assetRepository: AssetRepository;

  constructor() {
    this.assetRepository = new AssetRepository();
  }

  async getAssetsByProject(projectId: string): Promise<Asset[]> {
    return this.assetRepository.findByProjectId(projectId);
  }

  async getAssetsByProjectIds(projectIds: string[]): Promise<Asset[]> {
    return this.assetRepository.findByProjectIds(projectIds);
  }

  async getAllAssets(): Promise<Asset[]> {
    return this.assetRepository.findAll();
  }

  async getAssetById(id: string): Promise<Asset | null> {
    return this.assetRepository.findById(id);
  }

  async createAsset(data: CreateAssetInput): Promise<Asset> {
    return this.assetRepository.create(data);
  }
}

