import z from 'zod'

export const GetEventsParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  tags: z
    .preprocess(
      (val) => (Array.isArray(val) ? val : val !== undefined ? [val] : undefined),
      z.array(z.uuidv7()).optional(),
    )
    .optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  location: z.string().optional(),
})

export type GetEventsParams = z.infer<typeof GetEventsParamsSchema>
