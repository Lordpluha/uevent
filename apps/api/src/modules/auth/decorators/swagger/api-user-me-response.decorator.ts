import { ApiOkResponse } from '@nestjs/swagger'
import { userResponseSchema } from '../../../../common/swagger/openapi.util'

export const ApiUserMeResponse = (description: string) => ApiOkResponse({
  description,
  schema: userResponseSchema,
})
