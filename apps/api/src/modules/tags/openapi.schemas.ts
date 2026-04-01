import type { OpenApiSchemaMap } from '../../common/swagger/openapi.components'
import { schemaRefWith } from '../../common/swagger/openapi.components'

export const TAGS_OPENAPI_SCHEMAS: OpenApiSchemaMap = {
  TagResponse: schemaRefWith('Tag', {
    type: 'object',
    required: ['id', 'name'],
  }),
}
