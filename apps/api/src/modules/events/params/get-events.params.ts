import z from 'zod'

export const GetEventsParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  format: z.enum(['online', 'offline']).optional(),
  tags: z
    .preprocess(
      (val) => (Array.isArray(val) ? val : val !== undefined ? [val] : undefined),
      z.array(z.string()).optional(),
    )
    .optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  location: z.string().optional(),
  location_from: z.string().optional(),
  location_to: z.string().optional(),
  organization_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  sort_by: z.enum(['date', 'name', 'attendees']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
})

export type GetEventsParams = z.infer<typeof GetEventsParamsSchema>
