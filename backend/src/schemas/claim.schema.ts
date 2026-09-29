import { z } from 'zod';

export const createClaimSchema = z.object({
  claim: z.string().trim().min(1, 'Claim statement is required').max(500, 'Claim exceeds 500 characters'),
  confidence: z.number().min(0, 'Confidence must be >= 0').max(1, 'Confidence must be <= 1'),
  sourceType: z.enum(['asset_analysis', 'comparison', 'manual'], {
    errorMap: () => ({ message: 'sourceType must be asset_analysis, comparison, or manual' }),
  }),
  sourceId: z.string().trim().optional().nullable(),
  evidenceAssetIds: z
    .array(z.string().trim().min(1, 'Asset ID cannot be empty'))
    .min(1, 'A claim must be supported by at least one evidence asset'),
});

export const getClaimsQuerySchema = z.object({
  sourceType: z.enum(['all', 'asset_analysis', 'comparison', 'manual']).optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
});

export type CreateClaimSchema = z.infer<typeof createClaimSchema>;
export type GetClaimsQuerySchema = z.infer<typeof getClaimsQuerySchema>;
