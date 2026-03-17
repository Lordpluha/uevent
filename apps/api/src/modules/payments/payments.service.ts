import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Stripe from 'stripe'
import { Payment, PaymentStatus } from './entities/payment.entity'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class PaymentsService {
  private stripeInstance: Stripe | null = null
  private readonly logger = new Logger(PaymentsService.name)

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  private getStripe(): Stripe {
    if(!this.stripeInstance) {
      const apiKey = process.env.STRIPE_SECRET_KEY

      if(!apiKey) throw new BadRequestException('STRIPE_SECRET_KEY is not set in environment variables')

      this.stripeInstance = new Stripe(apiKey)
    }
    return this.stripeInstance
  }

  async createPaymentIntent(amount: number, currency: string = 'usd', metadata?: Record<string, string>) {
    try {
      const paymentIntent = await this.getStripe().paymentIntents.create({
        amount: Math.round(amount * 100), // convert dollars to cents
        currency,
        metadata: metadata || {},
      })

      this.logger.log(`Payment Intent created: ${paymentIntent.id}`)
      return paymentIntent
    } catch(error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`)
      throw new BadRequestException('Failed to create payment intent')
    }
  }


  async getPaymentIntent(paymentIntentId: string) {
    try {
      return await this.getStripe().paymentIntents.retrieve(paymentIntentId)
    } catch(error) {
      this.logger.error(`Failed to retrieve payment intent: ${error.message}`)
      throw new BadRequestException('Payment intent not found')
    }
  }


  async handleWebhookEvent(event: Stripe.Event) {
    this.logger.log(`Received event: ${event.type}`)

    switch(event.type) {
      case 'payment_intent.succeeded': return this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)

      case 'payment_intent.payment_failed': return this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)

      case 'charge.refunded': return this.handleChargeRefunded(event.data.object as Stripe.Charge)

      default: this.logger.warn(`Unhandled event type: ${event.type}`)
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      this.logger.log(`Payment succeeded: ${paymentIntent.id}`)

      let payment = await this.paymentRepository.findOne({
        where: { stripePaymentIntentId: paymentIntent.id },
      })

      if(!payment) {
        payment = this.paymentRepository.create({
          id: uuidv4(),
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: PaymentStatus.SUCCEEDED,
          metadata: paymentIntent.metadata,
        })
      } else {
        payment.status = PaymentStatus.SUCCEEDED
        payment.metadata = paymentIntent.metadata
      }

      await this.paymentRepository.save(payment)

      this.logger.log(`Payment ${paymentIntent.id} saved to database`)

      // TODO: EMAIL CONFIRMATION -> NotificationsService
      // await this.notificationsService.sendPaymentConfirmation(payment.userId, payment) ??
    } catch(error) {
      this.logger.error(`Error handling payment success: ${error.message}`)
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      this.logger.error(`Payment failed: ${paymentIntent.id}`)

      let payment = await this.paymentRepository.findOne({
        where: { stripePaymentIntentId: paymentIntent.id },
      })

      const failureReason = paymentIntent.last_payment_error?.message || 'No details available'

      if(!payment) {
        payment = this.paymentRepository.create({
          id: uuidv4(),
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: PaymentStatus.FAILED,
          failureReason,
          metadata: paymentIntent.metadata,
        })
      } else {
        payment.status = PaymentStatus.FAILED
        payment.failureReason = failureReason
      }

      await this.paymentRepository.save(payment)

      this.logger.log(`Payment ${paymentIntent.id} marked as failed in database`)

      // TODO: EMAIL FAILED PAYMENT -> NotificationsService
      // await this.notificationsService.sendPaymentFailed(payment.userId, payment, failureReason) ??
    } catch(error) {
      this.logger.error(`Error handling payment failure: ${error.message}`)
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    try {
      this.logger.log(`Charge refunded: ${charge.id}`)

      const paymentIntentId = charge.payment_intent?.toString()

      if(paymentIntentId) {
        const payment = await this.paymentRepository.findOne({
          where: { stripePaymentIntentId: paymentIntentId },
        })

        if(payment) {
          payment.status = PaymentStatus.REFUNDED
          payment.metadata = {
            ...payment.metadata,
            refundedAt: new Date().toISOString(),
            chargeId: charge.id,
          }

          await this.paymentRepository.save(payment)

          this.logger.log(`Payment ${paymentIntentId} marked as refunded`)

          // TODO: EMAIL REFUND NOTIFICATION -> NotificationsService
          // await this.notificationsService.sendRefundNotification(payment.userId, payment) ??
        }
      } else {
        this.logger.warn(`Could not find payment for charge ${charge.id}`)
      }
    } catch(error) {
      this.logger.error(`Error handling charge refund: ${error.message}`)
    }
  }

  constructWebhookEvent(body: Buffer | Record<string, any>, signature: string, secret: string): Stripe.Event {
    try {
      const bodyToUse = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)
      return this.getStripe().webhooks.constructEvent(bodyToUse, signature, secret)
    } catch(error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`)
      throw new BadRequestException('Webhook signature verification failed')
    }
  }
}
