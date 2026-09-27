import { GoogleGenAI } from '@google/genai';
import { AiAnalysisRepository } from '../repositories/ai-analysis.repository.js';
import { Asset, AiAnalysis } from '../types/index.js';

export interface VisionAnalysisResult {
  description: string;
  objects: string[];
  activities: string[];
  scene: string;
  visible_condition: string;
  confidence: number;
  source?: 'gemini' | 'simulated';
}

export class VisionService {
  private aiAnalysisRepository: AiAnalysisRepository;
  private genAI: GoogleGenAI | null = null;

  constructor() {
    this.aiAnalysisRepository = new AiAnalysisRepository();
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      try {
        this.genAI = new GoogleGenAI({ apiKey: apiKey.trim() });
        console.log('[VisionService] Google Gemini AI initialized successfully');
      } catch (err: any) {
        console.warn('[VisionService] Failed to initialize Google GenAI:', err.message);
      }
    } else {
      console.log('[VisionService] No GEMINI_API_KEY found, fallback simulation mode active');
    }
  }

  async getAnalysisByAssetId(assetId: string): Promise<AiAnalysis | null> {
    return this.aiAnalysisRepository.findByAssetId(assetId);
  }

  async getLatestAnalysesForAssets(assetIds: string[]): Promise<Map<string, AiAnalysis>> {
    return this.aiAnalysisRepository.findLatestByAssetIds(assetIds);
  }

  async getAllAnalyses(): Promise<AiAnalysis[]> {
    return this.aiAnalysisRepository.findAll();
  }

  async analyzeAsset(asset: Asset, projectName?: string): Promise<AiAnalysis> {
    // 1. Run AI inspection (Gemini or intelligent fallback)
    const result = await this.performVisionInspection(asset, projectName);

    // 2. Persist to database (ai_analysis table)
    const saved = await this.aiAnalysisRepository.create({
      asset_id: asset.id,
      description: result.description,
      objects: result.objects,
      activities: result.activities,
      scene: result.scene,
      visible_condition: result.visible_condition,
      confidence: result.confidence,
      source: result.source || 'gemini',
    });

    return saved;
  }

  private async performVisionInspection(asset: Asset, projectName?: string): Promise<VisionAnalysisResult> {
    // If Gemini is configured, execute real multimodal inspection
    if (this.genAI && asset.url) {
      console.log(`[VisionService] Invoking Gemini Vision for asset: ${asset.id} (${asset.type || 'image'})`);
      const geminiResult = await this.callGeminiVision(asset, projectName);
      if (geminiResult) {
        return geminiResult;
      }
    }

    // If Gemini is not configured, generate simulated fallback clearly marked as simulated
    console.log(`[VisionService] Running simulated fallback analysis for asset: ${asset.id}`);
    return this.generateContextualFallback(asset, projectName);
  }

  private async callGeminiVision(asset: Asset, projectName?: string): Promise<VisionAnalysisResult | null> {
    if (!this.genAI || !asset.url) return null;

    // 15-second AbortSignal timeout to prevent hanging on slow network transfers
    const mediaResponse = await fetch(asset.url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!mediaResponse.ok) {
      throw new Error(`Failed to fetch media from URL (${mediaResponse.status}): ${mediaResponse.statusText}`);
    }

    // Enforce 20MB file size ceiling via stream reading to prevent memory exhaustion
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    const contentLength = mediaResponse.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
      throw new Error('Media file exceeds maximum 20MB limit for AI inspection');
    }

    if (!mediaResponse.body) {
      throw new Error('Empty response body from media URL');
    }

    const reader = mediaResponse.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          receivedBytes += value.length;
          if (receivedBytes > MAX_SIZE) {
            await reader.cancel('Media file exceeded 20MB limit');
            throw new Error('Media file exceeds maximum 20MB limit for AI inspection');
          }
          chunks.push(value);
        }
      }
    } finally {
      reader.releaseLock();
    }

    const totalBuffer = Buffer.concat(chunks);
    const base64Data = totalBuffer.toString('base64');
    let mimeType = (mediaResponse.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();

    // Preserve real video or image MIME type
    if (!mimeType || mimeType === 'application/octet-stream') {
      if (asset.type === 'video' || asset.url.endsWith('.mp4')) {
        mimeType = 'video/mp4';
      } else if (asset.url.endsWith('.png')) {
        mimeType = 'image/png';
      } else if (asset.url.endsWith('.webp')) {
        mimeType = 'image/webp';
      } else {
        mimeType = 'image/jpeg';
      }
    }

    const systemPrompt = `You are an expert environmental and sustainability auditor inspecting on-site field evidence.
Analyze this ${asset.type === 'video' ? 'video' : 'photo'} to identify physical ground-truth activities (e.g. tree planting, solar installation, river restoration, waste cleanup, coastal conservation).
${projectName ? `Project context: "${projectName}".` : ''}

You MUST return a JSON object with the following fields:
{
  "description": "A concise 1-2 sentence description of the visible physical evidence and environmental activity",
  "objects": ["array of identifiable physical objects, e.g. tree, river, person, solar panel, sapling, soil"],
  "activities": ["array of recognized sustainability activities, e.g. tree plantation, riverbank restoration, microgrid maintenance"],
  "scene": "scene classification, e.g. river corridor, rural forest, solar field, coastal mangrove, urban rooftop",
  "visible_condition": "assessment of the physical condition, e.g. active green cover, newly planted saplings, functioning solar arrays",
  "confidence": a float number between 0.70 and 0.99 indicating detection certainty
}`;

    const primaryModel = this.resolveModelName();
    const candidateModels = Array.from(
      new Set([primaryModel, 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.6-flash'])
    );

    let lastError: any = null;
    let responseText: string | null = null;

    for (let attempt = 0; attempt < candidateModels.length; attempt++) {
      const model = candidateModels[attempt];
      try {
        console.log(`[VisionService] Attempting Gemini inference with model: ${model}`);
        const response = await this.genAI.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: systemPrompt,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          responseText = response.text;
          console.log(`[VisionService] Successful Gemini inference with model: ${model}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errInfo = this.extractProviderErrorInfo(err);
        console.warn(`[VisionService] Model ${model} failed (${errInfo.code} ${errInfo.status}): ${errInfo.message}`);

        // Stop fallback loop immediately for non-recoverable provider errors
        // (e.g. invalid server API key, disabled billing/permissions, malformed payloads, or project-wide quota exhaustion)
        if (errInfo.isFatal) {
          console.error(`[VisionService] Non-recoverable provider error encountered on ${model}. Aborting model fallback loop.`);
          break;
        }

        // Apply bounded jittered backoff for transient errors (503 demand spikes, 500 provider errors, or per-model rate limits)
        // Model deprecation / 404 proceeds immediately to the next candidate
        if (errInfo.code !== 404 && attempt < candidateModels.length - 1) {
          const delay = Math.min(1000, 200 * Math.pow(1.5, attempt)) + Math.floor(Math.random() * 100);
          console.log(`[VisionService] Waiting ${delay}ms before trying next candidate...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (!responseText) {
      throw lastError || new Error('All Gemini Vision models failed to respond');
    }

    const parsed = JSON.parse(responseText);

    return {
      description: String(parsed.description || 'Field evidence analyzed successfully.'),
      objects: Array.isArray(parsed.objects) ? parsed.objects.map(String) : ['environmental feature'],
      activities: Array.isArray(parsed.activities) ? parsed.activities.map(String) : ['sustainability monitoring'],
      scene: String(parsed.scene || 'outdoor site'),
      visible_condition: String(parsed.visible_condition || 'operational'),
      confidence: typeof parsed.confidence === 'number' ? Math.min(Math.max(parsed.confidence, 0.5), 0.99) : 0.92,
      source: 'gemini',
    };
  }

  private generateContextualFallback(asset: Asset, projectName?: string): VisionAnalysisResult {
    const hint = `${projectName || ''} ${asset.url} ${asset.uploaded_by || ''}`.toLowerCase();

    let fallbackData: Omit<VisionAnalysisResult, 'source'>;

    if (hint.includes('yamuna') || hint.includes('river') || hint.includes('water')) {
      fallbackData = {
        description: '[Simulated Preview] Aerial visual evidence showing river channel bordered by riparian vegetation and sandy embankment.',
        objects: ['river channel', 'riparian trees', 'wild vegetation', 'sandbank', 'waterway'],
        activities: ['river restoration', 'riparian buffer maintenance'],
        scene: 'river corridor / riparian wetland',
        visible_condition: 'dense natural vegetation along active waterway',
        confidence: 0.50,
      };
    } else if (hint.includes('solar') || hint.includes('energy') || hint.includes('panel')) {
      fallbackData = {
        description: '[Simulated Preview] Photographic evidence of ground-mounted photovoltaic solar arrays deployed in rural terrain.',
        objects: ['solar panels', 'mounting rack', 'inverter unit', 'dry soil'],
        activities: ['solar microgrid installation', 'clean energy generation'],
        scene: 'rural solar installation site',
        visible_condition: 'operational solar arrays without visible obstruction',
        confidence: 0.50,
      };
    } else {
      fallbackData = {
        description: '[Simulated Preview] Field inspection photograph indicating environmental conservation activity.',
        objects: ['trees', 'saplings', 'foliage', 'soil'],
        activities: ['tree plantation', 'field inspection'],
        scene: 'rural conservation area',
        visible_condition: 'vegetation growth observed',
        confidence: 0.50,
      };
    }

    return {
      ...fallbackData,
      source: 'simulated',
    };
  }

  private resolveModelName(): string {
    let raw = (process.env.GEMINI_MODEL || 'gemini-3.8-flash').trim().toLowerCase();
    // Normalize typos and spaces like "geimi 3.6 flash" -> "gemini-3.6-flash"
    raw = raw.replace(/^geimi/i, 'gemini').replace(/\s+/g, '-');
    if (!raw.startsWith('gemini-') && !raw.startsWith('models/')) {
      raw = `gemini-${raw}`;
    }
    return raw;
  }

  private extractProviderErrorInfo(err: any): {
    code: number;
    status: string;
    message: string;
    isFatal: boolean;
  } {
    let code = typeof err?.status === 'number' ? err.status : 500;
    let status = '';
    let message = err?.message || 'Unknown provider error';

    try {
      const parsed = typeof message === 'string' && message.startsWith('{') ? JSON.parse(message) : null;
      if (parsed?.error) {
        if (typeof parsed.error.code === 'number') code = parsed.error.code;
        if (typeof parsed.error.status === 'string') status = parsed.error.status;
        if (typeof parsed.error.message === 'string') message = parsed.error.message;
      }
    } catch {
      // not JSON
    }

    const lowerMessage = message.toLowerCase();
    const lowerStatus = status.toLowerCase();

    // Determine if this error is non-transient / non-recoverable by switching models:
    // 400 / INVALID_ARGUMENT: Payload/format error that will fail identically across all models
    // 401 / UNAUTHENTICATED: Invalid or rejected server API key
    // 403 / PERMISSION_DENIED: Billing disabled, account suspended, API not enabled
    // Project-wide daily quota exhaustion (e.g. "Quota exceeded for metric: ... PerDay")
    const isFatal =
      code === 400 ||
      code === 401 ||
      code === 403 ||
      lowerStatus === 'unauthenticated' ||
      lowerStatus === 'permission_denied' ||
      lowerStatus === 'invalid_argument' ||
      (code === 429 &&
        (lowerMessage.includes('perday') ||
          lowerMessage.includes('per_day') ||
          lowerMessage.includes('free_tier_requests, limit: 0')));

    return { code, status, message, isFatal };
  }
}
