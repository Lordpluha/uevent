import type { ReferenceObject, SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'

export type OpenApiSchema = SchemaObject | ReferenceObject
export type OpenApiSchemaMap = Record<string, OpenApiSchema>

export const schemaRef = (name: string): ReferenceObject => ({
  $ref: `#/components/schemas/${name}`,
})

export const schemaRefWith = (name: string, modifier: SchemaObject): SchemaObject => ({
  allOf: [schemaRef(name), modifier],
})
