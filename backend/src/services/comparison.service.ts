import { GoogleGenAI } from '@google/genai';
import { ProjectService } from './project.service.js';
import { AssetService } from './asset.service.js';
import { ComparisonRepository } from '../repositories/comparison.repository.js';
import {
  ComparisonRecord,
  ComparisonResult,
  ComparisonChange,
  Asset,
} from '../types/index.js';
import {
  comparisonResultSchema,
  CreateComparisonSchema,
} from '../schemas/comparison.schema.js';
import { ValidationError, NotFoundError, BadRequestError } from '../utils/errors.js';

export class ComparisonService {
  private projectService: ProjectService;
  private assetService: AssetService;
  private comparisonRepository: ComparisonRepository;
  private genAI: GoogleGenAI | null = null;
  private readonly defaultModel: string = 'gemini-3.8-flash';

  constructor() {
    this.projectService = new ProjectService();
    this.assetService = new AssetService();
    this.comparisonRepository = new ComparisonRepository();

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      try {
        this.genAI = new GoogleGenAI({ apiKey: apiKey.trim() });
        console.log('[ComparisonService] Google GenAI initialized for Before/After Intelligence');
      } catch (err: any) {
        console.warn('[ComparisonService] Failed to initialize Google GenAI:', err.message);
      }
    } else {
      console.log('[ComparisonService] No GEMINI_API_KEY found, simulation fallback active');
    }
  }

  async getComparisonsByProject(projectId: string, userId?: string): Promise<ComparisonRecord[]> {
    if (!projectId || !projectId.trim()) {
      throw new ValidationError('Project ID is required');
    }
    // Authorize: Enforce that user owns/has access to this project
    await this.projectService.getProjectById(projectId, userId);
    return this.comparisonRepository.findByProjectId(projectId);
  }

  async getComparisonById(id: string, projectId: string, userId?: string): Promise<ComparisonRecord> {
    if (!id || !id.trim()) {
      throw new ValidationError('Comparison ID is required');
    }
    // Authorize: Enforce that user owns/has access to this project
    await this.projectService.getProjectById(projectId, userId);

    const record = await this.comparisonRepository.findById(id);
    if (!record || record.project_id !== projectId) {
      throw new NotFoundError(`Comparison with ID ${id} not found in this project`);
    }
    return record;
  }

  async compare(
    projectId: string,
    input: CreateComparisonSchema,
    userId?: string
  ): Promise<ComparisonRecord> {
    const { beforeAssetId, afterAssetId } = input;

    // 1. Authorize project access
    const project = await this.projectService.getProjectById(projectId, userId);

    // 2. Asset validation
    if (beforeAssetId === afterAssetId) {
      throw new ValidationError('beforeAssetId and afterAssetId cannot be the same asset');
    }

    const [beforeAsset, afterAsset] = await Promise.all([
      this.assetService.getAssetById(beforeAssetId),
      this.assetService.getAssetById(afterAssetId),
    ]);

    if (!beforeAsset) {
      throw new NotFoundError(`Before asset with ID ${beforeAssetId} not found`);
    }
    if (!afterAsset) {
      throw new NotFoundError(`After asset with ID ${afterAssetId} not found`);
    }

    // Verify both assets belong to the authorized project
    if (beforeAsset.project_id !== projectId) {
      throw new ValidationError(`Asset ${beforeAssetId} does not belong to project ${projectId}`);
    }
    if (afterAsset.project_id !== projectId) {
      throw new ValidationError(`Asset ${afterAssetId} does not belong to project ${projectId}`);
    }

    // Validate that both are image assets
    if (beforeAsset.type && beforeAsset.type !== 'image') {
      throw new ValidationError(`Before asset ${beforeAssetId} is not an image (${beforeAsset.type})`);
    }
    if (afterAsset.type && afterAsset.type !== 'image') {
      throw new ValidationError(`After asset ${afterAssetId} is not an image (${afterAsset.type})`);
    }

    // 3. Chronological date validation
    if (beforeAsset.capture_date && afterAsset.capture_date) {
      const beforeTime = new Date(beforeAsset.capture_date).getTime();
      const afterTime = new Date(afterAsset.capture_date).getTime();
      if (!isNaN(beforeTime) && !isNaN(afterTime) && beforeTime > afterTime) {
        throw new ValidationError(
          `Chronological mismatch: The 'Before' photo date (${beforeAsset.capture_date.slice(0, 10)}) is later than the 'After' photo date (${afterAsset.capture_date.slice(0, 10)}). Please swap the selection.`
        );
      }
    }

    // 4. Duplicate comparison prevention
    const existing = await this.comparisonRepository.findByPair(
      projectId,
      beforeAssetId,
      afterAssetId
    );
    if (existing) {
      console.log(
        `[ComparisonService] Reusing existing comparison record ${existing.id} for pair (${beforeAssetId} -> ${afterAssetId})`
      );
      return existing;
    }

    // 5. Run AI Vision Comparison
    let comparisonResult: ComparisonResult;
    let modelName = this.defaultModel;

    if (this.genAI) {
      try {
        console.log(
          `[ComparisonService] Running multimodal comparison on pair: ${beforeAssetId} (before) vs ${afterAssetId} (after)`
        );
        const { result, usedModel } = await this.executeGeminiComparison(
          beforeAsset,
          afterAsset,
          project.name
        );
        comparisonResult = result;
        modelName = usedModel;
      } catch (err: any) {
        console.warn(
          `[ComparisonService] Gemini comparison failed (${err.message}), falling back to simulated analysis`
        );
        comparisonResult = this.generateSimulatedComparison(beforeAsset, afterAsset, project.name);
        modelName = 'simulated-comparison';
      }
    } else {
      console.log('[ComparisonService] Gemini not configured, generating simulated comparison');
      comparisonResult = this.generateSimulatedComparison(beforeAsset, afterAsset, project.name);
      modelName = 'simulated-comparison';
    }

    // 6. Schema validation before persistence
    const validated = comparisonResultSchema.parse(comparisonResult);

    // Determine status
    let status: 'completed' | 'inconclusive' = 'completed';
    if (
      validated.overall_confidence < 0.5 ||
      validated.summary.toLowerCase().includes('different viewpoint') ||
      validated.summary.toLowerCase().includes('inconclusive') ||
      validated.summary.toLowerCase().includes('limiting reliable')
    ) {
      status = 'inconclusive';
    }

    // 7. Persist to repository
    const saved = await this.comparisonRepository.create({
      project_id: projectId,
      before_asset_id: beforeAssetId,
      after_asset_id: afterAssetId,
      comparison_result: validated,
      confidence: validated.overall_confidence,
      status,
      model: modelName,
      created_by: userId || null,
    });

    return saved;
  }

  private async fetchImageData(
    imageUrl: string
  ): Promise<{ base64Data: string; mimeType: string }> {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL (${response.status}): ${response.statusText}`);
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
      throw new Error('Image file exceeds maximum 20MB limit for comparison');
    }

    if (!response.body) {
      throw new Error('Empty response body from image URL');
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          receivedBytes += value.length;
          if (receivedBytes > MAX_SIZE) {
            await reader.cancel('Image file exceeded 20MB limit');
            throw new Error('Image file exceeds maximum 20MB limit for comparison');
          }
          chunks.push(value);
        }
      }
    } finally {
      reader.releaseLock();
    }

    const buffer = Buffer.concat(chunks);
    const base64Data = buffer.toString('base64');
    let mimeType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();

    if (!mimeType || mimeType === 'application/octet-stream') {
      if (imageUrl.endsWith('.png')) mimeType = 'image/png';
      else if (imageUrl.endsWith('.webp')) mimeType = 'image/webp';
      else mimeType = 'image/jpeg';
    }

    return { base64Data, mimeType };
  }

  private async executeGeminiComparison(
    beforeAsset: Asset,
    afterAsset: Asset,
    projectName?: string
  ): Promise<{ result: ComparisonResult; usedModel: string }> {
    if (!this.genAI) throw new Error('GenAI not initialized');

    // Fetch both images concurrently with stream safety
    const [beforeData, afterData] = await Promise.all([
      this.fetchImageData(beforeAsset.url),
      this.fetchImageData(afterAsset.url),
    ]);

    const systemPrompt = `You are a rigorous environmental visual verification auditor analyzing Before and After photographic evidence.
Project context: "${projectName || 'Sustainability Initiative'}".

INSTRUCTIONS:
1. Compare the BEFORE image and the AFTER image.
2. Identify ONLY changes that are VISIBLY SUPPORTED by the two images.
3. Focus on observable physical differences such as:
   - vegetation (ground cover, tree density, sapling growth, canopy)
   - visible waste (litter, debris piles, scrap material)
   - water appearance (channel clarity, water level, bank embankment)
   - land appearance (soil stability, erosion, excavation, earthworks)
   - visible infrastructure (fences, microgrids, solar arrays, pipes, paths)
   - visible human activity (active planting, clean-up operations, maintenance)
   - visible physical condition (structural wear, maintenance status)

STRICT PROHIBITIONS:
- Do NOT infer unsupported scientific measurements or causal conclusions.
- Do NOT estimate biodiversity increase/decrease by percentages.
- Do NOT estimate carbon emissions reduction or sequestration numbers.
- Do NOT estimate pollution concentration or chemical water quality indexes.
- Do NOT fabricate exact environmental improvement percentages.

SPECIAL CASES:
- If the images are too different in viewpoint, framing, angle, or season to make a reliable comparison, state that explicitly in the summary, set changes to [], and set overall_confidence to <= 0.50.
- If there are no clear visible changes, set summary to "No clear visible changes were identified." and set changes to [].

OUTPUT REQUIREMENTS:
Return a JSON object conforming strictly to this structure:
{
  "summary": "A concise 1-3 sentence summary describing observable physical differences.",
  "changes": [
    {
      "description": "Clear description of observed change (e.g., 'Increased visible vegetation along the embankment')",
      "category": "vegetation" | "waste" | "water" | "land" | "infrastructure" | "human_activity" | "condition",
      "direction": "increase" | "decrease" | "new" | "removed" | "changed" | "unchanged" | "uncertain",
      "confidence": float between 0.0 and 1.0 indicating visual observation certainty
    }
  ],
  "overall_confidence": float between 0.0 and 1.0 indicating confidence in the comparison
}`;

    const candidateModels = [
      this.defaultModel,
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-flash-latest',
    ];

    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        console.log(`[ComparisonService] Attempting Gemini comparison with model: ${model}`);
        const response = await this.genAI.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                { text: 'BEFORE IMAGE:' },
                {
                  inlineData: {
                    mimeType: beforeData.mimeType,
                    data: beforeData.base64Data,
                  },
                },
                { text: 'AFTER IMAGE:' },
                {
                  inlineData: {
                    mimeType: afterData.mimeType,
                    data: afterData.base64Data,
                  },
                },
                { text: systemPrompt },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const raw = JSON.parse(response.text);

          // Normalize confidence values if given on 0-100 scale instead of 0-1
          const normalizeConfidence = (val: any): number => {
            const num = Number(val);
            if (isNaN(num)) return 0.8;
            if (num > 1.0 && num <= 100.0) return Number((num / 100.0).toFixed(3));
            return Math.min(Math.max(num, 0), 1.0);
          };

          const rawChanges = Array.isArray(raw.changes) ? raw.changes : [];
          const normalizedChanges: ComparisonChange[] = rawChanges.map((c: any) => ({
            description: String(c.description || 'Observed visual change'),
            category: c.category || 'condition',
            direction: c.direction || 'changed',
            confidence: normalizeConfidence(c.confidence),
          }));

          const normalizedResult: ComparisonResult = {
            summary: String(raw.summary || 'Visual comparison completed.'),
            changes: normalizedChanges,
            overall_confidence: normalizeConfidence(raw.overall_confidence),
          };

          // Validate with Zod
          const validated = comparisonResultSchema.parse(normalizedResult);
          return { result: validated, usedModel: model };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[ComparisonService] Model ${model} comparison failed:`, err.message);
      }
    }

    throw lastError || new Error('All Gemini candidate models failed to generate comparison');
  }

  private generateSimulatedComparison(
    beforeAsset: Asset,
    afterAsset: Asset,
    projectName?: string
  ): ComparisonResult {
    const hint = `${projectName || ''} ${beforeAsset.url} ${afterAsset.url}`.toLowerCase();

    if (hint.includes('solar') || hint.includes('panel')) {
      return {
        summary:
          'The after image displays newly installed ground-mounted solar panels across the cleared plot, whereas the before image showed undeveloped bare terrain.',
        changes: [
          {
            description: 'New ground-mounted photovoltaic solar arrays installed on metal racking',
            category: 'infrastructure',
            direction: 'new',
            confidence: 0.94,
          },
          {
            description: 'Cleared ground perimeter with reduced wild scrub and dry brush',
            category: 'land',
            direction: 'changed',
            confidence: 0.89,
          },
          {
            description: 'Electrical inverter and conduit cabling visible adjacent to panels',
            category: 'infrastructure',
            direction: 'new',
            confidence: 0.85,
          },
        ],
        overall_confidence: 0.91,
      };
    }

    if (hint.includes('river') || hint.includes('yamuna') || hint.includes('water')) {
      return {
        summary:
          'The after photo shows an increase in visible green riparian vegetation and ground cover along the shoreline, with visibly less loose surface debris compared to the before photo.',
        changes: [
          {
            description: 'Increased visible green ground cover and young sapling foliage',
            category: 'vegetation',
            direction: 'increase',
            confidence: 0.92,
          },
          {
            description: 'Reduced visible surface debris and loose plastic waste along the waterbank',
            category: 'waste',
            direction: 'decrease',
            confidence: 0.88,
          },
          {
            description: 'Stabilized soil embankment and cleared access path along the shoreline',
            category: 'land',
            direction: 'changed',
            confidence: 0.84,
          },
        ],
        overall_confidence: 0.89,
      };
    }

    return {
      summary:
        'The after image demonstrates increased visible vegetation cover and newly planted saplings compared to the baseline photo.',
      changes: [
        {
          description: 'Increased visible tree saplings and foliage coverage across the plot',
          category: 'vegetation',
          direction: 'increase',
          confidence: 0.91,
        },
        {
          description: 'Reduced visible loose ground debris and cleared planting beds',
          category: 'waste',
          direction: 'decrease',
          confidence: 0.86,
        },
      ],
      overall_confidence: 0.88,
    };
  }
}
