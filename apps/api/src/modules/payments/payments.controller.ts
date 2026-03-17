import { Controller, Post, Get, Body, Param, Headers, RawBodyRequest, Req, HttpCode, Logger } from '@nestjs/common'
import { Request } from 'express'
import { PaymentsService } from './payments.service'
import Stripe from 'stripe'

@Controller('api/payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name)

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  async createPaymentIntent(@Body() body: { amount: number; currency?: string; orderId?: string }) {
    const { amount, currency = 'usd', orderId } = body

    if(!amount || amount <= 0) throw new Error('Invalid amount')

    const metadata: Record<string, string> = {}
    
    if(orderId) metadata.orderId = orderId

    const paymentIntent = await this.paymentsService.createPaymentIntent(amount, currency, metadata)

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }
  }

  @Get(':paymentIntentId')
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    const paymentIntent = await this.paymentsService.getPaymentIntent(paymentIntentId)

    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // convert back to dollars
      currency: paymentIntent.currency,
      clientSecret: paymentIntent.client_secret,
    }
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {

    if(!signature) {
      this.logger.error('Missing stripe-signature header')
      return { received: false }
    }

    try {
      const event = this.paymentsService.constructWebhookEvent(
        req.rawBody || Buffer.from(''),
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || '',
      )

      await this.paymentsService.handleWebhookEvent(event)

      return { received: true }
    } catch(error) {
      this.logger.error(`Webhook error: ${error.message}`)
      return { received: false }
    }
  }
}
