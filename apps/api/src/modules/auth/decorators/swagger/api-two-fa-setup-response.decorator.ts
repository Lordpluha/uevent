import { ApiOkResponse } from '@nestjs/swagger'
import { twoFaSetupResponseSchema } from '../../../../common/swagger/openapi.util'

export const ApiTwoFaSetupResponse = (description: string) =>
  ApiOkResponse({
    description,
    schema: twoFaSetupResponseSchema,
  })
