import z from 'zod'

export const CreateTagDtoSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
})

export type CreateTagDto = z.infer<typeof CreateTagDtoSchema>
