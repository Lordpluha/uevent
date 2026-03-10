import { CreateUserDtoSchema } from './create-user.dto'

export const UpdateUserDtoSchema = CreateUserDtoSchema.partial()

export type UpdateUserDto = ReturnType<typeof UpdateUserDtoSchema.parse>
