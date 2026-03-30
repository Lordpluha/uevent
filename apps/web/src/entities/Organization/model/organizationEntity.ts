import { z } from 'zod';

export const organizationSchema = z.object({
  id: z.string(),
  title: z.string(),
  href: z.string(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  slogan: z.string().optional(),
  phone: z.string().optional(),
  category: z.string(),
  foundedAt: z.string(),
  membersCount: z.number(),
  eventsCount: z.number(),
  followers: z.number(),
  isFollowing: z.boolean().optional(),
  verified: z.boolean(),
  twoFactorEnabled: z.boolean(),
});

export const organizationListSchema = z.array(organizationSchema);

export type Organization = z.infer<typeof organizationSchema>;
export type OrganizationList = z.infer<typeof organizationListSchema>;

// ── Raw backend shapes ─────────────────────────────────────

export type ApiOrganization = {
  id: string;
  name?: string | null;
  slogan?: string | null;
  description?: string | null;
  avatar?: string | null;
  phone?: string | null;
  email?: string;
  category?: string | null;
  verified?: boolean;
  two_factor_enabled?: boolean;
  tags?: string[] | null;
  city?: string | null;
  website?: string | null;
  coverUrl?: string | null;
  foundedAt?: string;
  created_at?: string;
  membersCount?: number;
  eventsCount?: number;
  followers?: number;
  is_following?: boolean;
  href?: string;
};

export type ApiOrganizationListResponse = {
  data: ApiOrganization[];
  meta: { total: number; page: number; limit: number; total_pages: number };
};

// ── Mapper ─────────────────────────────────────────────────

export const mapApiOrganization = (raw: ApiOrganization): Organization => ({
  id: String(raw.id),
  title: raw.name ?? '',
  href: raw.href ?? `/organizations/${String(raw.id)}`,
  email: raw.email ?? undefined,
  avatarUrl: raw.avatar ?? undefined,
  coverUrl: raw.coverUrl ?? undefined,
  description: raw.description ?? undefined,
  location: raw.city ?? undefined,
  website: raw.website ?? undefined,
  slogan: raw.slogan ?? undefined,
  phone: raw.phone ?? undefined,
  category: raw.category ?? '',
  foundedAt: raw.foundedAt ?? raw.created_at ?? '',
  membersCount: raw.membersCount ?? 0,
  eventsCount: raw.eventsCount ?? 0,
  followers: raw.followers ?? 0,
  isFollowing: raw.is_following,
  verified: raw.verified ?? false,
  twoFactorEnabled: raw.two_factor_enabled ?? false,
});

