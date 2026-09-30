import { z } from 'zod';

export const createProjectSchema = z
  .object({
    name: z
      .string({ required_error: 'Project name is required' })
      .trim()
      .min(1, 'Project name is required')
      .max(150, 'Project name must not exceed 150 characters'),
    description: z.string().trim().max(1000, 'Description must not exceed 1000 characters').optional().nullable(),
    location: z.string().trim().max(200, 'Location must not exceed 200 characters').optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    project_type: z.string().trim().max(50).optional().nullable(),
    created_by: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        const start = new Date(data.start_date).getTime();
        const end = new Date(data.end_date).getTime();
        if (!isNaN(start) && !isNaN(end)) {
          return end >= start;
        }
      }
      return true;
    },
    {
      message: 'End date cannot be earlier than start date',
      path: ['end_date'],
    }
  );

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Project name cannot be empty')
      .max(150, 'Project name must not exceed 150 characters')
      .optional(),
    description: z.string().trim().max(1000, 'Description must not exceed 1000 characters').optional().nullable(),
    location: z.string().trim().max(200, 'Location must not exceed 200 characters').optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    project_type: z.string().trim().max(50).optional().nullable(),
    created_by: z.string().optional().nullable(),
    updated_at: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        const start = new Date(data.start_date).getTime();
        const end = new Date(data.end_date).getTime();
        if (!isNaN(start) && !isNaN(end)) {
          return end >= start;
        }
      }
      return true;
    },
    {
      message: 'End date cannot be earlier than start date',
      path: ['end_date'],
    }
  );

