import { applyDecorators } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiHeader,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import type { OpenApiSchema } from './openapi.components'
import { schemaRef, schemaRefWith } from './openapi.components'
import { z } from 'zod'

export const genericObjectSchema: SchemaObject = {
  type: 'object',
}

export const tagResponseSchema: OpenApiSchema = schemaRef('TagResponse')
export const userResponseSchema: OpenApiSchema = schemaRef('UserResponse')
export const organizationResponseSchema: OpenApiSchema = schemaRef('OrganizationResponse')
export const eventResponseSchema: OpenApiSchema = schemaRef('EventResponse')
export const ticketResponseSchema: OpenApiSchema = schemaRef('TicketResponse')
export const notificationResponseSchema: OpenApiSchema = schemaRef('NotificationResponse')
export const userSessionResponseSchema: OpenApiSchema = schemaRef('UserSessionResponse')

export const userAuthResultSchema: OpenApiSchema = schemaRef('UserAuthResultResponse')
export const organizationAuthResultSchema: OpenApiSchema = schemaRef('OrganizationAuthResultResponse')
export const twoFaSetupResponseSchema: OpenApiSchema = schemaRef('TwoFaSetupResponse')
export const twoFaEnabledResponseSchema: OpenApiSchema = schemaRef('TwoFaEnabledResponse')
export const calendarEventCreateResponseSchema: OpenApiSchema = schemaRef('CalendarEventCreateResponse')
export const createPaymentIntentResponseSchema: OpenApiSchema = schemaRef('CreatePaymentIntentResponse')
export const paymentIntentStatusResponseSchema: OpenApiSchema = schemaRef('PaymentIntentStatusResponse')
export const emailSendResultSchema: OpenApiSchema = schemaRef('EmailSendResultResponse')

export const paginatedMetaSchema: SchemaObject = {
  type: 'object',
  properties: {
    total: { type: 'integer', example: 42 },
    page: { type: 'integer', example: 1 },
    limit: { type: 'integer', example: 20 },
    total_pages: { type: 'integer', example: 3 },
  },
  required: ['total', 'page', 'limit', 'total_pages'],
}

export const messageSchema = (message: string): SchemaObject => ({
  type: 'object',
  properties: {
    message: { type: 'string', example: message },
  },
  required: ['message'],
})

export const paginatedResponseSchema = (itemSchema: OpenApiSchema = genericObjectSchema): SchemaObject => {
  return schemaRefWith('PaginatedResponseBase', {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: itemSchema,
      },
    },
    required: ['data'],
  })
}

const stripSchemaMetadata = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripSchemaMetadata)
  if (!value || typeof value !== 'object') return value

  const result: Record<string, unknown> = {}
  for (const [key, nested] of Object.entries(value)) {
    if (key === '$schema') continue
    result[key] = stripSchemaMetadata(nested)
  }
  return result
}

export const zodToOpenApiSchema = (schema: z.ZodType): SchemaObject => {
  try {
    return stripSchemaMetadata(z.toJSONSchema(schema, { unrepresentable: 'any' })) as SchemaObject
  } catch {
    return {} as SchemaObject
  }
}

export const ApiZodBody = (schema: z.ZodType, description?: string) => {
  return ApiBody({
    description,
    required: true,
    schema: zodToOpenApiSchema(schema),
  })
}

export const ApiAccessCookieAuth = () => {
  return applyDecorators(
    ApiCookieAuth('access-cookie'),
    ApiBearerAuth('bearer-auth'),
    ApiUnauthorizedResponse({
      description:
        'Requires the HTTP-only access_token cookie. Bearer JWT authorization is also accepted as a fallback for API clients.',
    }),
  )
}

export const ApiRefreshCookieAuth = () => {
  return applyDecorators(
    ApiCookieAuth('refresh-cookie'),
    ApiUnauthorizedResponse({
      description: 'Requires the HTTP-only refresh_token cookie.',
    }),
  )
}

export const ApiUuidParam = (name: string, description: string) => {
  return ApiParam({
    name,
    description,
    schema: { type: 'string', format: 'uuid' },
  })
}

export const ApiAcceptLanguageHeader = () => {
  return ApiHeader({
    name: 'Accept-Language',
    required: false,
    description: 'Optional response localization. Supported locales: en, ua.',
    schema: { type: 'string', example: 'en' },
  })
}

export const ApiMultipartFile = (fieldName: string, isArray: boolean = false, description?: string) => {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description,
      schema: {
        type: 'object',
        properties: {
          [fieldName]: isArray
            ? {
                type: 'array',
                items: { type: 'string', format: 'binary' },
              }
            : {
                type: 'string',
                format: 'binary',
              },
        },
        required: [fieldName],
      },
    }),
  )
}