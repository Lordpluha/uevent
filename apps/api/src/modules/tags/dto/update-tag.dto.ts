import { CreateTagDtoSchema } from './create-tag.dto'

export const UpdateTagDtoSchema = CreateTagDtoSchema.partial()

export type UpdateTagDto = ReturnType<typeof UpdateTagDtoSchema.parse>
