import { z } from 'zod';

export const createComparisonSchema = z
  .object({
    beforeAssetId: z.string().trim().min(1, 'beforeAssetId is required'),
    afterAssetId: z.string().trim().min(1, 'afterAssetId is required'),
  })
  .refine((data) => data.beforeAssetId !== data.afterAssetId, {
    message: 'beforeAssetId and afterAssetId cannot be the same asset',
    path: ['afterAssetId'],
  });

export const comparisonChangeSchema = z.object({
  description: z.string().trim().min(1, 'Change description cannot be empty').max(500),
  category: z.enum(
    ['vegetation', 'waste', 'water', 'land', 'infrastructure', 'human_activity', 'condition'],
    {
      errorMap: () => ({
        message:
          'Category must be one of: vegetation, waste, water, land, infrastructure, human_activity, condition',
      }),
    }
  ),
  direction: z.enum(
    ['increase', 'decrease', 'new', 'removed', 'changed', 'unchanged', 'uncertain'],
    {
      errorMap: () => ({
        message:
          'Direction must be one of: increase, decrease, new, removed, changed, unchanged, uncertain',
      }),
    }
  ),
  confidence: z.number().min(0).max(1),
});

export const comparisonResultSchema = z.object({
  summary: z.string().trim().min(1, 'Comparison summary is required').max(2000),
  changes: z.array(comparisonChangeSchema),
  overall_confidence: z.number().min(0).max(1),
});

export type CreateComparisonSchema = z.infer<typeof createComparisonSchema>;
export type ComparisonChangeSchema = z.infer<typeof comparisonChangeSchema>;
export type ComparisonResultSchema = z.infer<typeof comparisonResultSchema>;
