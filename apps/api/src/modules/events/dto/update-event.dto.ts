import { CreateEventDtoSchema } from './create-event.dto'
import z from 'zod'

export const UpdateEventDtoSchema = CreateEventDtoSchema.partial()

export type UpdateEventDto = z.infer<typeof UpdateEventDtoSchema>
