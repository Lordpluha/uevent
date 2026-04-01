import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Stripe from 'stripe'
import { Payment, PaymentStatus } from './entities/payment.entity'
import { EmailService } from '../notifications/email.service'
import { v4 as uuidv4 } from 'uuid'
import { Ticket } from '../users/entities/ticket.entity'
import { Notification } from '../notifications/entities/notification.entity'
import { User } from '../users/entities/user.entity'
import { ApiConfigService } from '../../config/api-config.service'

@Injectable()
export class PaymentsService {
  private stripeInstance: Stripe | null = null
  private readonly logger = new Logger(PaymentsService.name)

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,

    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly emailService: EmailService,
    private readonly apiConfig: ApiConfigService,
  ) {}

  private async markTicketAsSold(metadata?: Record<string, string>) {
    const ticketId = metadata?.ticketId
    if (!ticketId) return

    const quantity = Math.max(1, Number(metadata?.quantity ?? 1))
    const ticket = await this.ticketsRepository.findOneBy({ id: ticketId })
    if (!ticket) {
      this.logger.warn(`Ticket ${ticketId} not found while marking payment as sold`)
      return
    }

    if (ticket.quantity_limited && ticket.quantity_total !== null) {
      const remaining = Math.max(0, ticket.quantity_total - ticket.quantity_sold)
      if (quantity > remaining) {
        this.logger.warn(`Payment quantity ${quantity} exceeds remaining ticket stock ${remaining} for ticket ${ticketId}`)
        ticket.quantity_sold = ticket.quantity_total
      } else {
        ticket.quantity_sold += quantity
      }
    } else {
      ticket.quantity_sold += quantity
    }

    await this.ticketsRepository.save(ticket)
  }

  private async createOrganizationPurchaseNotification(metadata?: Record<string, string>) {
    const ticketId = metadata?.ticketId
    if (!ticketId) return

    const quantity = Math.max(1, Number(metadata?.quantity ?? 1))
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: ['event'],
    })

    const organizationId = ticket?.event?.organization_id
    if (!organizationId) {
      this.logger.warn(`Could not resolve organization for ticket ${ticketId}`)
      return
    }

    const eventTitle = metadata?.eventTitle || ticket?.event?.name || 'your event'
    const ticketName = metadata?.ticketName || ticket?.name || 'ticket'

    const notification = this.notificationsRepository.create({
      name: 'New ticket purchase',
      content: `A customer bought ${quantity} × ${ticketName} for ${eventTitle}.`,
      user_id: null,
      organization_id: organizationId,
    })

    await this.notificationsRepository.save(notification)
  }

  private getStripe(): Stripe {
    if(!this.stripeInstance) {
      const apiKey = this.apiConfig.stripeConfig.secretKey

      if(!apiKey) throw new BadRequestException('STRIPE_SECRET_KEY is not set in environment variables')

      this.stripeInstance = new Stripe(apiKey)
    }
    return this.stripeInstance
  }

  async createPaymentIntent(amount: number, currency?: string, metadata?: Record<string, string>) {
    try {
      const resolvedCurrency = (currency ?? this.apiConfig.paymentCurrency).toLowerCase()
      const feeCents = this.apiConfig.paymentFeeCents
      const totalAmount = Math.round(amount) + feeCents

      const paymentIntent = await this.getStripe().paymentIntents.create({
        amount: totalAmount,
        currency: resolvedCurrency,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      })

      this.logger.log(`Payment Intent created: ${paymentIntent.id}`)
      return paymentIntent
    } catch(error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`)
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`)
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


  handleWebhookEvent(event: Stripe.Event) {
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
      this.logger.log(`WEBHOOK RECEIVED: Payment succeeded: ${paymentIntent.id}`)
      this.logger.log(`Payment metadata:`, JSON.stringify(paymentIntent.metadata))
      this.logger.log(`Payment method type: ${paymentIntent.payment_method_types[0] || 'unknown'}`)

      let payment = await this.paymentRepository.findOne({
        where: { stripePaymentIntentId: paymentIntent.id },
      })

      if(!payment) {
        this.logger.log(`Creating new payment record...`)
        payment = this.paymentRepository.create({
          id: uuidv4(),
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: PaymentStatus.SUCCEEDED,
          metadata: paymentIntent.metadata,
        })
      }else {
        payment.status = PaymentStatus.SUCCEEDED
        payment.metadata = paymentIntent.metadata
      }

      await this.paymentRepository.save(payment)

      this.logger.log(`Payment ${paymentIntent.id} saved to database`)

      await this.markTicketAsSold(paymentIntent.metadata)
      await this.createOrganizationPurchaseNotification(paymentIntent.metadata)

      // payment confirmation email
      if(paymentIntent.metadata) {
        this.logger.log(`Sending email to: ${paymentIntent.metadata.userEmail}`)
        await this.sendPaymentConfirmationEmail(paymentIntent)
      }else {
        this.logger.warn(`No metadata found - skipping email`)
      }
    } catch(error) {
      this.logger.error(`Error handling payment success: ${error.message}`)
    }
  }

  private async sendPaymentConfirmationEmail(paymentIntent: Stripe.PaymentIntent) {
    try {
      const metadata = paymentIntent.metadata

      if(!metadata?.userEmail || !metadata?.userName) {
        this.logger.warn(`Missing required email data for payment ${paymentIntent.id}`)
        return
      }

      // Check user preference for payment emails
      const user = await this.usersRepository.findOne({ where: { email: metadata.userEmail } })
      if(user && !user.payment_email_enabled) {
        this.logger.log(`Payment email disabled for user ${metadata.userEmail} — skipping`)
        return
      }

      await this.emailService.sendPaymentConfirmation({
        userEmail: metadata.userEmail,
        userName: metadata.userName,
        eventTitle: metadata.eventTitle || 'Ticket Purchase',
        ticketName: metadata.ticketName || 'Ticket',
        price: paymentIntent.amount / 100,
        eventDate: metadata.eventDate || '',
        eventLocation: metadata.eventLocation || '',
        organizationName: metadata.organizationName || '',
        paymentIntentId: paymentIntent.id,
      })

      this.logger.log(`Payment confirmation email sent to ${metadata.userEmail}`)
    } catch(error) {
      this.logger.error(`Failed to send payment confirmation email: ${error.message}`)
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
      }else {
        payment.status = PaymentStatus.FAILED
        payment.failureReason = failureReason
      }

      await this.paymentRepository.save(payment)

      this.logger.log(`Payment ${paymentIntent.id} marked as failed in database`)

      // send failed payment email
      if(paymentIntent.metadata?.userEmail) {
        this.logger.log(`Sending failed payment email to: ${paymentIntent.metadata.userEmail}`)
        await this.emailService.sendPaymentFailedEmail(
          paymentIntent.metadata.userEmail,
          paymentIntent.metadata.userName || 'Valued Customer',
          paymentIntent.metadata.eventTitle || 'Ticket Purchase',
          paymentIntent.metadata.ticketName || 'Ticket',
          failureReason,
          paymentIntent.id
        )
      }else if(payment?.metadata?.userEmail) {
        this.logger.log(`Using metadata from database record. Sending failed payment email to: ${payment.metadata.userEmail}`)
        await this.emailService.sendPaymentFailedEmail(
          payment.metadata.userEmail,
          payment.metadata.userName || 'Valued Customer',
          payment.metadata.eventTitle || 'Ticket Purchase',
          payment.metadata.ticketName || 'Ticket',
          failureReason,
          paymentIntent.id
        )
      }else {
        this.logger.warn(`No email found in webhook metadata or database - skipping failed payment email`)
      }
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

          // send refund email
          if(payment.metadata) {
            this.logger.log(`Sending refund email to: ${payment.metadata.userEmail}`)
            await this.emailService.sendRefundEmail(
              payment.metadata.userEmail,
              payment.metadata.userName,
              payment.metadata.eventTitle || 'Ticket Purchase',
              payment.metadata.ticketName || 'Ticket',
              payment.amount,
              paymentIntentId
            )
          }else {
            this.logger.warn(`No metadata found - skipping refund email`)
          }
        }
      }else {
        this.logger.warn(`Could not find payment for charge ${charge.id}`)
      }
    } catch(error) {
      this.logger.error(`Error handling charge refund: ${error.message}`)
    }
  }

  constructWebhookEvent(body: Buffer | Record<string, unknown>, signature: string, secret: string): Stripe.Event {
    try {
      const bodyToUse = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)
      return this.getStripe().webhooks.constructEvent(bodyToUse, signature, secret)
    } catch(error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`)
      throw new BadRequestException('Webhook signature verification failed')
    }
  }
}