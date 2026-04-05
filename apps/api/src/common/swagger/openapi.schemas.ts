import { AUTH_OPENAPI_SCHEMAS } from '../../modules/auth/openapi.schemas'
import { EVENTS_OPENAPI_SCHEMAS } from '../../modules/events/openapi.schemas'
import { NOTIFICATIONS_OPENAPI_SCHEMAS } from '../../modules/notifications/openapi.schemas'
import { ORGANIZATIONS_OPENAPI_SCHEMAS } from '../../modules/organizations/openapi.schemas'
import { PAYMENTS_OPENAPI_SCHEMAS } from '../../modules/payments/openapi.schemas'
import { TAGS_OPENAPI_SCHEMAS } from '../../modules/tags/openapi.schemas'
import { TICKETS_OPENAPI_SCHEMAS } from '../../modules/tickets/openapi.schemas'
import { USERS_OPENAPI_SCHEMAS } from '../../modules/users/openapi.schemas'
import type { OpenApiSchemaMap } from './openapi.components'

export const MODULE_OPENAPI_SCHEMAS: OpenApiSchemaMap = {
  PaginatedResponseBase: {
    type: 'object',
    properties: {
      meta: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total_pages: { type: 'integer', example: 3 },
        },
        required: ['total', 'page', 'limit', 'total_pages'],
      },
    },
    required: ['meta'],
  },
  ...TAGS_OPENAPI_SCHEMAS,
  ...EVENTS_OPENAPI_SCHEMAS,
  ...ORGANIZATIONS_OPENAPI_SCHEMAS,
  ...USERS_OPENAPI_SCHEMAS,
  ...TICKETS_OPENAPI_SCHEMAS,
  ...NOTIFICATIONS_OPENAPI_SCHEMAS,
  ...AUTH_OPENAPI_SCHEMAS,
  ...PAYMENTS_OPENAPI_SCHEMAS,
}
