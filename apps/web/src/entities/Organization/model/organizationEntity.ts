import { z } from 'zod';

export const organizationSchema = z.object({
  id: z.string(),
  title: z.string(),
  href: z.string(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  category: z.string(),
  foundedAt: z.string(),
  membersCount: z.number(),
  eventsCount: z.number(),
  followers: z.number(),
  verified: z.boolean(),
});

export const organizationListSchema = z.array(organizationSchema);

export type Organization = z.infer<typeof organizationSchema>;
export type OrganizationList = z.infer<typeof organizationListSchema>;
