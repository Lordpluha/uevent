import type { OpenApiSchemaMap } from '../../common/swagger/openapi.components'
import { schemaRef } from '../../common/swagger/openapi.components'

export const PAYMENTS_OPENAPI_SCHEMAS: OpenApiSchemaMap = {
  CreatePaymentIntentResponse: schemaRef('CreatePaymentIntentModel'),
  PaymentConfigResponse: schemaRef('PaymentConfigModel'),
  PaymentIntentStatusResponse: schemaRef('PaymentIntentStatusModel'),
  EmailSendResultResponse: schemaRef('EmailSendResultModel'),
}
