import { ApiOkResponse } from '@nestjs/swagger'
import { organizationAuthResultSchema } from '../../../../common/swagger/openapi.util'

export const ApiOrganizationAuthResultResponse = (description: string) =>
  ApiOkResponse({
    description,
    schema: organizationAuthResultSchema,
  })
