import { z } from 'zod'

export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  read: z.boolean(),
  link: z.string().nullable().optional(),
})

export const notificationListSchema = z.array(notificationSchema)

export type Notification = z.infer<typeof notificationSchema>

export type ApiNotification = {
  id: string
  name?: string | null
  content?: string | null
  created_at?: string | null
  is_read?: boolean | null
  link?: string | null
}

export const mapApiNotification = (raw: ApiNotification): Notification => ({
  id: raw.id,
  title: raw.name?.trim() || '',
  content: raw.content?.trim() || '',
  createdAt: raw.created_at ?? new Date().toISOString(),
  read: raw.is_read ?? false,
  link: raw.link ?? null,
})
