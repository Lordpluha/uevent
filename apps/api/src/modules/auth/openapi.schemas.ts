import type { OpenApiSchemaMap } from '../../common/swagger/openapi.components'
import { schemaRef } from '../../common/swagger/openapi.components'

export const AUTH_OPENAPI_SCHEMAS: OpenApiSchemaMap = {
  UserAuthResultResponse: {
    oneOf: [schemaRef('UserAuthSuccessModel'), schemaRef('TwoFaRequiredModel')],
  },
  OrganizationAuthResultResponse: {
    oneOf: [schemaRef('OrganizationAuthSuccessModel'), schemaRef('TwoFaRequiredModel')],
  },
  TwoFaSetupResponse: schemaRef('TwoFaSetupModel'),
  TwoFaEnabledResponse: schemaRef('TwoFaEnabledModel'),
  CalendarEventCreateResponse: schemaRef('CalendarEventCreateModel'),
}
