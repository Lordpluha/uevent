import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  timezone: z.string().optional(),
  interests: z.array(z.string()),
  notificationsEnabled: z.boolean(),
  pushNotificationsEnabled: z.boolean(),
  paymentEmailEnabled: z.boolean(),
  subscriptionNotificationsEnabled: z.boolean(),
  loginNotificationsEnabled: z.boolean(),
  hiddenFromAttendees: z.boolean(),
  twoFa: z.boolean(),
  joinedAt: z.string(),
  ticketsCount: z.number(),
  eventsAttended: z.number(),
  followers: z.number(),
  following: z.number(),
})

export const userListSchema = z.array(userSchema)

export type User = z.infer<typeof userSchema>
export type UserList = z.infer<typeof userListSchema>

export type ApiUser = {
  id: string | number
  name?: string | null
  email?: string | null
  phone?: string | null
  username?: string | null
  first_name?: string | null
  last_name?: string | null
  avatar?: string | null
  avatarUrl?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  timezone?: string | null
  interests?: string[] | null
  notifications_enabled?: boolean | null
  push_notifications_enabled?: boolean | null
  payment_email_enabled?: boolean | null
  subscription_notifications_enabled?: boolean | null
  login_notifications_enabled?: boolean | null
  hidden_from_attendees?: boolean | null
  two_fa?: boolean | null
  joinedAt?: string | null
  createdAt?: string | null
  created_at?: string | null
  ticketsCount?: number | null
  eventsAttended?: number | null
  followers?: number | null
  following?: number | null
}

export type ApiUserListResponse = {
  data: ApiUser[]
  meta: { total: number; page: number; limit: number; total_pages: number }
}

export const formatJoinedAt = (value?: string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const mapApiUser = (raw: ApiUser): User => {
  const id = String(raw.id)
  const composedName = [raw.first_name, raw.last_name].filter(Boolean).join(' ').trim()
  const name = raw.name?.trim() || composedName || id
  const username = raw.username?.trim() || id

  return {
    id,
    name,
    username,
    email: raw.email ?? undefined,
    phone: raw.phone ?? undefined,
    avatarUrl: raw.avatarUrl ?? raw.avatar ?? undefined,
    bio: raw.bio ?? undefined,
    location: raw.location ?? undefined,
    website: raw.website ?? undefined,
    timezone: raw.timezone ?? undefined,
    interests: raw.interests ?? [],
    notificationsEnabled: raw.notifications_enabled ?? true,
    pushNotificationsEnabled: raw.push_notifications_enabled ?? false,
    paymentEmailEnabled: raw.payment_email_enabled ?? true,
    subscriptionNotificationsEnabled: raw.subscription_notifications_enabled ?? true,
    loginNotificationsEnabled: raw.login_notifications_enabled ?? true,
    hiddenFromAttendees: raw.hidden_from_attendees ?? false,
    twoFa: raw.two_fa ?? false,
    joinedAt: formatJoinedAt(raw.joinedAt ?? raw.createdAt ?? raw.created_at),
    ticketsCount: raw.ticketsCount ?? 0,
    eventsAttended: raw.eventsAttended ?? 0,
    followers: raw.followers ?? 0,
    following: raw.following ?? 0,
  }
}
