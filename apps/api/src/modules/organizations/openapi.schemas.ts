import type { OpenApiSchemaMap } from '../../common/swagger/openapi.components'
import { schemaRefWith } from '../../common/swagger/openapi.components'

export const ORGANIZATIONS_OPENAPI_SCHEMAS: OpenApiSchemaMap = {
  OrganizationResponse: schemaRefWith('Organization', {
    type: 'object',
    required: ['id', 'name', 'email', 'verified', 'two_factor_enabled'],
  }),
}
