import { z } from 'zod';

export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  read: z.boolean(),
});

export const notificationListSchema = z.array(notificationSchema);

export type Notification = z.infer<typeof notificationSchema>;

export type ApiNotification = {
  id: string;
  name?: string | null;
  content?: string | null;
  created?: string | null;
  had_readed?: boolean | null;
};

export const mapApiNotification = (raw: ApiNotification): Notification => ({
  id: raw.id,
  title: raw.name?.trim() || 'Notification',
  content: raw.content?.trim() || '',
  createdAt: raw.created ?? new Date().toISOString(),
  read: raw.had_readed ?? false,
});
