import { z } from 'zod';

export const semanticSearchSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  query: z
    .string()
    .trim()
    .min(1, 'Search query cannot be empty')
    .max(500, 'Search query cannot exceed 500 characters'),
  mediaType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  threshold: z.number().min(0).max(1).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const backfillSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required for backfill'),
  batchSize: z.number().int().min(1).max(100).optional(),
});

export const indexingStatsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required for indexing statistics'),
});

export type SemanticSearchSchema = z.infer<typeof semanticSearchSchema>;
export type BackfillSchema = z.infer<typeof backfillSchema>;

