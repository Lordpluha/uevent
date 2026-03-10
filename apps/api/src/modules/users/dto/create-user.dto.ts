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
})

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>
