import z from 'zod'

export const FindOrCreateTagsDtoSchema = z.object({
  names: z.array(z.string().min(1)).min(1),
})

export type FindOrCreateTagsDto = z.infer<typeof FindOrCreateTagsDtoSchema>
