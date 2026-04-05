import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  timezone: z.string().optional(),
  interests: z.array(z.string()).optional(),
  notificationsEnabled: z.boolean().optional(),
  pushNotificationsEnabled: z.boolean().optional(),
  paymentEmailEnabled: z.boolean().optional(),
  subscriptionNotificationsEnabled: z.boolean().optional(),
  loginNotificationsEnabled: z.boolean().optional(),
  hiddenFromAttendees: z.boolean().optional(),
  twoFa: z.boolean().optional(),
  password: z.string().min(8).optional(),
})

export const userListParamsSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
})

export type CreateUserDto = z.infer<typeof createUserSchema>
export type UpdateUserDto = z.infer<typeof updateUserSchema>
export type UserListParams = z.infer<typeof userListParamsSchema>
