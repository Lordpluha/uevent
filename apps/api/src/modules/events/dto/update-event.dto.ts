import z from 'zod'
import { CreateEventDtoSchema } from './create-event.dto'

export const UpdateEventDtoSchema = CreateEventDtoSchema.omit({ organization_id: true }).partial()

export type UpdateEventDto = z.infer<typeof UpdateEventDtoSchema>
