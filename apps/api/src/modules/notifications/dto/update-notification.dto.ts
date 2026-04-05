import z from 'zod'

export const UpdateNotificationDtoSchema = z.object({
  name: z.string().optional(),
  content: z.string().optional(),
  user_id: z.string().uuid().nullable().optional(),
  organization_id: z.string().uuid().nullable().optional(),
})

export type UpdateNotificationDto = z.infer<typeof UpdateNotificationDtoSchema>
