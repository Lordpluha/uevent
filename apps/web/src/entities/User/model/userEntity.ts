import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  joinedAt: z.string(),
  ticketsCount: z.number(),
  eventsAttended: z.number(),
  followers: z.number(),
  following: z.number(),
  interests: z.array(z.string()),
});

export const userListSchema = z.array(userSchema);

export type User = z.infer<typeof userSchema>;
export type UserList = z.infer<typeof userListSchema>;
