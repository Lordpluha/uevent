import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreatePaymentIntentModel {
  @ApiPropertyOptional({ nullable: true })
  clientSecret: string | null

  @ApiProperty()
  paymentIntentId: string
}

export class PaymentIntentStatusModel {
  @ApiProperty()
  status: string

  @ApiProperty()
  amount: number

  @ApiProperty()
  currency: string

  @ApiPropertyOptional({ nullable: true })
  clientSecret: string | null
}

export class EmailSendResultModel {
  @ApiProperty()
  success: boolean

  @ApiProperty()
  message: string

  @ApiPropertyOptional()
  messageId?: string
}