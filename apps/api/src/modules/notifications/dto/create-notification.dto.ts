import z from 'zod'

export const CreateNotificationDtoSchema = z.object({
  name: z.string(),
  content: z.string(),
  user_id: z.uuidv7(),
})

export type CreateNotificationDto = z.infer<typeof CreateNotificationDtoSchema>
