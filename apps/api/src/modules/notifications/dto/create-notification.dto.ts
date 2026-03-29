import z from 'zod'

export const CreateNotificationDtoSchema = z.object({
  name: z.string(),
  content: z.string(),
  user_id: z.string().uuid().nullable().optional(),
  organization_id: z.string().uuid().nullable().optional(),
}).refine(
  (value) => Boolean(value.user_id || value.organization_id),
  { message: 'Either user_id or organization_id is required' },
)

export type CreateNotificationDto = z.infer<typeof CreateNotificationDtoSchema>
