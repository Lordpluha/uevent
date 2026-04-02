import type { OpenApiSchemaMap } from '../../common/swagger/openapi.components'
import { schemaRefWith } from '../../common/swagger/openapi.components'

export const TICKETS_OPENAPI_SCHEMAS: OpenApiSchemaMap = {
  TicketResponse: schemaRefWith('Ticket', {
    type: 'object',
    required: ['id', 'name', 'status', 'datetime_start', 'datetime_end', 'price', 'event_id', 'created_at'],
  }),
}
