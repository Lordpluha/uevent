import { CreateEventDtoSchema } from './create-event.dto'
import z from 'zod'

export const UpdateEventDtoSchema = CreateEventDtoSchema.omit({ organization_id: true }).partial()

export type UpdateEventDto = z.infer<typeof UpdateEventDtoSchema>
