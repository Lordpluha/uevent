import z from 'zod'

export const GetOrganizationsParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  verified: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  search: z.string().optional(),
  tags: z
    .preprocess(
      (val) => (Array.isArray(val) ? val : val !== undefined ? [val] : undefined),
      z.array(z.string()).optional(),
    )
    .optional(),
  city: z.string().optional(),
})

export type GetOrganizationsParams = z.infer<typeof GetOrganizationsParamsSchema>
