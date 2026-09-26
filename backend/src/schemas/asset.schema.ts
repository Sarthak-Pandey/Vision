import { z } from 'zod';

export const createAssetSchema = z.object({
  project_id: z.string().min(1, 'Project ID is required'),
  cloudinary_public_id: z.string().nullable().optional(),
  url: z.string().min(1, 'Media URL is required'),
  type: z.string().default('image').optional(),
  capture_date: z.string().optional(),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').nullable().optional(),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').nullable().optional(),
  uploaded_by: z.string().optional(),
});

export type CreateAssetSchema = z.infer<typeof createAssetSchema>;
