import z from 'zod'

export const CreateEventDtoSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  time_zone: z.string(),
  datetime_start: z.coerce.date(),
  datetime_end: z.coerce.date(),
  seats: z.number().optional(),
  location: z.string().optional(),
  location_map_url: z.url().optional(),
  online_link: z.url().optional(),
  organization_id: z.string().uuid().optional(),
  tags: z.array(z.string().uuid()).optional(),
  attendees_public: z.boolean().optional(),
  notify_new_attendees: z.boolean().optional(),
  redirect_url: z.url().optional().nullable(),
  publish_at: z.coerce.date().optional().nullable(),
})

export type CreateEventDto = z.infer<typeof CreateEventDtoSchema>
