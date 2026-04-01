import type { OpenApiSchemaMap } from '../../common/swagger/openapi.components'
import { schemaRef, schemaRefWith } from '../../common/swagger/openapi.components'

export const EVENTS_OPENAPI_SCHEMAS: OpenApiSchemaMap = {
  EventResponse: schemaRefWith('Event', {
    type: 'object',
    properties: {
      tags: { type: 'array', items: schemaRef('TagResponse') },
    },
    required: ['id', 'name', 'datetime_start', 'datetime_end', 'organization_id'],
  }),
}
