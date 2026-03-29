import z from 'zod'

export const CreateUserDtoSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().optional(),
  timezone: z.string().optional(),
  interests: z.array(z.string()).optional(),
  notifications_enabled: z.boolean().optional(),
  push_notifications_enabled: z.boolean().optional(),
  payment_email_enabled: z.boolean().optional(),
  subscription_notifications_enabled: z.boolean().optional(),
  login_notifications_enabled: z.boolean().optional(),
  two_fa: z.boolean().optional(),
})

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>
