import { ApiOkResponse } from '@nestjs/swagger'
import { organizationResponseSchema } from '../../../../common/swagger/openapi.util'

export const ApiOrganizationMeResponse = (description: string) => ApiOkResponse({
  description,
  schema: organizationResponseSchema,
})
