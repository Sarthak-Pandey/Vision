import { GoogleGenAI } from '@google/genai';

export interface IEmbeddingService {
  embedImage(imageUrl: string, mimeType?: string): Promise<number[]>;
  embedText(query: string): Promise<number[]>;
  getModelName(): string;
  getDimension(): number;
}

export class EmbeddingService implements IEmbeddingService {
  private genAI: GoogleGenAI | null = null;
  private readonly modelName: string = 'gemini-embedding-2';
  private readonly dimension: number = 1536;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      try {
        this.genAI = new GoogleGenAI({ apiKey: apiKey.trim() });
        console.log(`[EmbeddingService] Initialized Google GenAI with model: ${this.modelName} (dim: ${this.dimension})`);
      } catch (err: any) {
        console.warn('[EmbeddingService] Failed to initialize Google GenAI:', err.message);
      }
    } else {
      console.log('[EmbeddingService] No GEMINI_API_KEY found, fallback simulation mode active');
    }
  }

  getModelName(): string {
    return this.modelName;
  }

  getDimension(): number {
    return this.dimension;
  }

  async embedImage(imageUrl: string, suggestedMimeType?: string): Promise<number[]> {
    if (!imageUrl || imageUrl.trim() === '') {
      throw new Error('Image URL is required for generating an image embedding');
    }

    if (!this.genAI) {
      console.warn('[EmbeddingService] GenAI not configured, generating simulated image embedding');
      return this.generateSimulatedVector(imageUrl);
    }

    // 1. Fetch image with 15-second timeout and 20MB stream ceiling
    const mediaResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15000),
    });

    if (!mediaResponse.ok) {
      throw new Error(`Failed to fetch image from URL (${mediaResponse.status}): ${mediaResponse.statusText}`);
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    const contentLength = mediaResponse.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
      throw new Error('Image file exceeds maximum 20MB limit for embedding generation');
    }

    if (!mediaResponse.body) {
      throw new Error('Empty response body from image URL');
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
            await reader.cancel('Image file exceeded 20MB limit');
            throw new Error('Image file exceeds maximum 20MB limit for embedding generation');
          }
          chunks.push(value);
        }
      }
    } finally {
      reader.releaseLock();
    }

    const totalBuffer = Buffer.concat(chunks);
    const base64Data = totalBuffer.toString('base64');

    let mimeType = suggestedMimeType || (mediaResponse.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!mimeType || mimeType === 'application/octet-stream') {
      if (imageUrl.endsWith('.png')) {
        mimeType = 'image/png';
      } else if (imageUrl.endsWith('.webp')) {
        mimeType = 'image/webp';
      } else {
        mimeType = 'image/jpeg';
      }
    }

    // 2. Call embedding model with retry & backoff
    return this.executeWithRetry(async () => {
      const response = await this.genAI!.models.embedContent({
        model: this.modelName,
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
            ],
          },
        ],
        config: {
          outputDimensionality: this.dimension,
        },
      });

      const vector = response.embeddings?.[0]?.values;
      if (!vector || !Array.isArray(vector) || vector.length === 0) {
        throw new Error('Embedding provider returned empty vector');
      }

      if (vector.length !== this.dimension) {
        throw new Error(`Embedding dimension mismatch: expected ${this.dimension}, got ${vector.length}`);
      }

      return vector;
    }, `Image [${imageUrl.slice(-20)}]`);
  }

  async embedText(query: string): Promise<number[]> {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      throw new Error('Text query cannot be empty');
    }

    if (!this.genAI) {
      console.warn('[EmbeddingService] GenAI not configured, generating simulated query embedding');
      return this.generateSimulatedVector(trimmed);
    }

    return this.executeWithRetry(async () => {
      const response = await this.genAI!.models.embedContent({
        model: this.modelName,
        contents: trimmed,
        config: {
          outputDimensionality: this.dimension,
        },
      });

      const vector = response.embeddings?.[0]?.values;
      if (!vector || !Array.isArray(vector) || vector.length === 0) {
        throw new Error('Embedding provider returned empty vector');
      }

      if (vector.length !== this.dimension) {
        throw new Error(`Embedding dimension mismatch: expected ${this.dimension}, got ${vector.length}`);
      }

      return vector;
    }, `Query "${trimmed.slice(0, 30)}"`);
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, label: string, maxAttempts = 3): Promise<T> {
    let lastError: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const status = err?.status || (err?.message?.includes('503') ? 503 : err?.message?.includes('429') ? 429 : 500);

        // Fatal non-retryable errors
        const message = String(err?.message || '').toLowerCase();
        const isFatal =
          status === 400 ||
          status === 401 ||
          status === 403 ||
          message.includes('unauthenticated') ||
          message.includes('permission_denied') ||
          message.includes('invalid_argument');

        if (isFatal || attempt === maxAttempts - 1) {
          console.error(`[EmbeddingService] Fatal or max retries reached for ${label}:`, err.message);
          throw err;
        }

        const delay = Math.min(1500, 300 * Math.pow(1.5, attempt)) + Math.floor(Math.random() * 100);
        console.warn(`[EmbeddingService] Transient failure for ${label} (${status}), retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Deterministic L2-normalized simulated vector for offline/testing modes
   */
  private generateSimulatedVector(seed: string): number[] {
    const vector: number[] = new Array(this.dimension);
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }

    let norm = 0;
    for (let i = 0; i < this.dimension; i++) {
      const val = Math.sin(hash + i * 0.17);
      vector[i] = val;
      norm += val * val;
    }

    const sqrtNorm = Math.sqrt(norm) || 1;
    return vector.map((v) => Number((v / sqrtNorm).toFixed(6)));
  }
}
