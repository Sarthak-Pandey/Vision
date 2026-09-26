import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { config } from '../config/env.js';

export class CloudinaryService {
  /**
   * Uploads a buffer or file to Cloudinary, with automatic fallback when credentials aren't set
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'ai-impact-evidence'
  ): Promise<{ url: string; public_id: string }> {
    if (isCloudinaryConfigured()) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error || !result) {
              return reject(new Error(error?.message || 'Cloudinary upload failed'));
            }
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          }
        );

        uploadStream.end(file.buffer);
      });
    }

    // Fallback: Generate a base64 data URL with mock public ID for local development
    const base64Data = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9_-]/g, '_');
    const mockPublicId = `local_${Date.now()}_${sanitizedName}`;

    return {
      url: dataUrl,
      public_id: mockPublicId,
    };
  }

  /**
   * Generates a signed upload signature for direct client-to-Cloudinary uploads
   */
  async generateUploadSignature(folder: string = 'ai-impact-evidence') {
    const timestamp = Math.round(new Date().getTime() / 1000);

    let signature = '';
    if (isCloudinaryConfigured() && config.cloudinaryApiSecret) {
      signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        config.cloudinaryApiSecret
      );
    }

    return {
      timestamp,
      folder,
      signature,
      cloudName: config.cloudinaryCloudName || '',
      apiKey: config.cloudinaryApiKey || '',
      isLiveConfigured: isCloudinaryConfigured(),
    };
  }
}

