import z from 'zod'

export const CreateEventDtoSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  time_zone: z.string(),
  datetime_start: z.date(),
  datetime_end: z.date(),
  seats: z.number().optional(),
  location: z.string().optional(),
  organization_id: z.number().optional(),
  tags: z.array(z.uuidv7()).optional(),
})

export type CreateEventDto = z.infer<typeof CreateEventDtoSchema>
