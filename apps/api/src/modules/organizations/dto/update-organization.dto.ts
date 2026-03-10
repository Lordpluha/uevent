import z from 'zod'
import { CreateOrganizationDtoSchema } from './create-organization.dto'

export const UpdateOrganizationDtoSchema = CreateOrganizationDtoSchema.partial()
export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationDtoSchema>
