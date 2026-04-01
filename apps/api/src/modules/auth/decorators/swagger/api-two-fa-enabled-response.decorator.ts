import { ApiOkResponse } from '@nestjs/swagger'
import { twoFaEnabledResponseSchema } from '../../../../common/swagger/openapi.util'

export const ApiTwoFaEnabledResponse = (description: string) => ApiOkResponse({
  description,
  schema: twoFaEnabledResponseSchema,
})
