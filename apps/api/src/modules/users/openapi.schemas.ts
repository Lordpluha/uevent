import type { OpenApiSchemaMap } from '../../common/swagger/openapi.components'
import { schemaRefWith } from '../../common/swagger/openapi.components'

export const USERS_OPENAPI_SCHEMAS: OpenApiSchemaMap = {
  UserResponse: schemaRefWith('User', {
    type: 'object',
    required: ['id', 'username', 'email', 'two_fa', 'created_at'],
  }),
  UserSessionResponse: schemaRefWith('UserSession', {
    type: 'object',
    properties: {
      is_current: { type: 'boolean' },
    },
    required: ['id', 'created_at', 'last_active_at', 'is_current'],
  }),
}
