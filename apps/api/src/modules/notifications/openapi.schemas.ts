import type { OpenApiSchemaMap } from '../../common/swagger/openapi.components'
import { schemaRefWith } from '../../common/swagger/openapi.components'

export const NOTIFICATIONS_OPENAPI_SCHEMAS: OpenApiSchemaMap = {
  NotificationResponse: schemaRefWith('Notification', {
    type: 'object',
    required: ['id', 'name', 'content', 'created', 'had_readed'],
  }),
}
