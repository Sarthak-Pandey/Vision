import { v2 as cloudinary } from 'cloudinary';
import { config } from './env.js';

if (config.cloudinaryCloudName && config.cloudinaryCloudName !== 'mock-cloud-name') {
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
    secure: true,
  });
}

export const isCloudinaryConfigured = (): boolean => {
  return !!(
    config.cloudinaryCloudName &&
    config.cloudinaryCloudName !== 'mock-cloud' &&
    config.cloudinaryCloudName !== 'mock-cloud-name' &&
    !config.cloudinaryCloudName.includes('your-cloudinary') &&
    config.cloudinaryApiKey &&
    config.cloudinaryApiKey !== 'mock-key' &&
    !config.cloudinaryApiKey.includes('your-cloudinary') &&
    config.cloudinaryApiSecret &&
    config.cloudinaryApiSecret !== 'mock-secret' &&
    !config.cloudinaryApiSecret.includes('your-cloudinary')
  );
};

export { cloudinary };

