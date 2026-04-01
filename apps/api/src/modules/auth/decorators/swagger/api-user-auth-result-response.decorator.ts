import { ApiOkResponse } from '@nestjs/swagger'
import { userAuthResultSchema } from '../../../../common/swagger/openapi.util'

export const ApiUserAuthResultResponse = (description: string) => ApiOkResponse({
  description,
  schema: userAuthResultSchema,
})
