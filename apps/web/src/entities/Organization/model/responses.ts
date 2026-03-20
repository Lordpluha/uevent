import { z } from 'zod';

/* ── Raw backend shapes (as returned by the API) ─────────── */

export const backendOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slogan: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string(),
  category: z.string().nullable().optional(),
  verified: z.boolean().optional(),
  tags: z.array(z.string()).nullable().optional(),
  city: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  foundedAt: z.string().optional(),
  membersCount: z.number().optional(),
  eventsCount: z.number().optional(),
  followers: z.number().optional(),
  href: z.string().optional(),
});

export const backendOrgListResponseSchema = z.object({
  data: z.array(backendOrganizationSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    total_pages: z.number(),
  }),
});

export type BackendOrganization = z.infer<typeof backendOrganizationSchema>;
export type BackendOrgListResponse = z.infer<typeof backendOrgListResponseSchema>;
