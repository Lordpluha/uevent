import z from 'zod'

export const GetTagsParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type GetTagsParams = z.infer<typeof GetTagsParamsSchema>
