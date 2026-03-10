import { z } from 'zod';

export const createOrganizationSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  location: z.string().optional(),
  website: z.string().url().optional(),
});

export const updateOrganizationSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
});

export const organizationListParamsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});

export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;
export type OrganizationListParams = z.infer<typeof organizationListParamsSchema>;
