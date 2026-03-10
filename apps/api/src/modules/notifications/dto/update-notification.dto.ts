import z from 'zod'
import { CreateNotificationDtoSchema } from './create-notification.dto'

export const UpdateNotificationDtoSchema = CreateNotificationDtoSchema.partial()

export type UpdateNotificationDto = z.infer<typeof UpdateNotificationDtoSchema>
