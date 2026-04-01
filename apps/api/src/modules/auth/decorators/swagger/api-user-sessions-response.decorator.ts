import { ApiOkResponse } from '@nestjs/swagger'
import { userSessionResponseSchema } from '../../../../common/swagger/openapi.util'

export const ApiUserSessionsResponse = (description: string) => ApiOkResponse({
  description,
  schema: { type: 'array', items: userSessionResponseSchema },
})
