import z from 'zod'

export const UpdateOrgProfileDtoSchema = z.object({
  name: z.string().min(1).optional(),
  slogan: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  avatar: z.string().url().optional(),
})

export const UpdateOrgEmailDtoSchema = z.object({
  email: z.email(),
})

export const ChangeOrgPasswordDtoSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
})

export const UpdateOrgSecurityDtoSchema = z.object({
  two_factor_enabled: z.boolean(),
})

export type UpdateOrgProfileDto = z.infer<typeof UpdateOrgProfileDtoSchema>
export type UpdateOrgEmailDto = z.infer<typeof UpdateOrgEmailDtoSchema>
export type ChangeOrgPasswordDto = z.infer<typeof ChangeOrgPasswordDtoSchema>
export type UpdateOrgSecurityDto = z.infer<typeof UpdateOrgSecurityDtoSchema>
