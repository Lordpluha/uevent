import z from 'zod'


export const CreateOrganizationDtoSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string(),
  slogan: z.string().optional(),
  description: z.string().optional(),
  avatar: z.string().optional(),
  phone: z.string().optional(),
  category: z.string().optional(),
  verified: z.boolean().optional(),
})

export type CreateOrganizationDto = z.infer<typeof CreateOrganizationDtoSchema>
