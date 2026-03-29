import { Controller, Post, Get, Body, Param, Headers, RawBodyRequest, Req, HttpCode, Logger, BadRequestException } from '@nestjs/common'
import { Request } from 'express'
import { PaymentsService } from './payments.service'
import { EmailService } from '../notifications/email.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/entities/user.entity'
import Stripe from 'stripe'

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name)

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly emailService: EmailService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  @Post('create-intent')
  async createPaymentIntent(@Body() body: {
    amount: number
    currency?: string
    orderId?: string
    ticketId?: string
    quantity?: number
    userEmail?: string
    userName?: string
    eventTitle?: string
    ticketName?: string
    eventDate?: string
    eventLocation?: string
    organizationName?: string
  }) {
    const {
      amount,
      currency = 'usd',
      orderId,
      ticketId,
      quantity,
      userEmail,
      userName,
      eventTitle,
      ticketName,
      eventDate,
      eventLocation,
      organizationName,
    } = body

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid amount. Expected positive integer amount in cents.')
    }
    if (Math.round(amount) < 50) {
      throw new BadRequestException('Minimum payment amount is 50 cents.')
    }

    const metadata: Record<string, string> = {}

    if(orderId) metadata.orderId = orderId
    if(ticketId) metadata.ticketId = ticketId
    if(quantity && quantity > 0) metadata.quantity = String(quantity)
    if(userEmail) metadata.userEmail = userEmail
    if(userName) metadata.userName = userName
    if(eventTitle) metadata.eventTitle = eventTitle
    if(ticketName) metadata.ticketName = ticketName
    if(eventDate) metadata.eventDate = eventDate
    if(eventLocation) metadata.eventLocation = eventLocation
    if(organizationName) metadata.organizationName = organizationName

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

  @Post('test-email')
  async sendTestEmail(@Body() body: { email: string }) {
    this.logger.log(`Testing email sending to: ${body.email}`)

    try {
      const result = await this.emailService.sendPaymentConfirmation({
        userEmail: body.email,
        userName: 'Test User',
        eventTitle: 'Test Event',
        ticketName: 'Test Ticket',
        price: 29.99,
        eventDate: '2026-03-28',
        eventLocation: 'Test Location',
        organizationName: 'Test Org',
        paymentIntentId: 'pi_test_12345',
      })

      if(result) {
        return {
          success: true,
          message: 'Test email sent successfully!',
          messageId: result.messageId,
        }
      } else {
        return {
          success: false,
          message: 'Email failed to send (check logs)',
        }
      }
    } catch(error) {
      this.logger.error(`Test email failed: ${error.message}`)
      return {
        success: false,
        message: `Error: ${error.message}`,
      }
    }
  }

  @Post('send-confirmation')
  async sendPaymentConfirmation(@Body() body: {
    userEmail: string
    userName?: string
    eventTitle?: string
    ticketName?: string
    price?: number
    eventDate?: string
    eventLocation?: string
    organizationName?: string
    paymentIntentId?: string
  }) {
    this.logger.log(`Sending payment confirmation email to: ${body.userEmail}`)

    // Check user preference for payment emails
    const user = await this.usersRepository.findOne({ where: { email: body.userEmail } })
    if(user && !user.payment_email_enabled) {
      this.logger.log(`Payment email disabled for user ${body.userEmail} — skipping`)
      return {
        success: true,
        message: 'Payment email disabled by user preference',
      }
    }

    try {
      const result = await this.emailService.sendPaymentConfirmation({
        userEmail: body.userEmail,
        userName: body.userName || 'Valued Customer',
        eventTitle: body.eventTitle || 'Event',
        ticketName: body.ticketName || 'Ticket',
        price: body.price || 0,
        eventDate: body.eventDate || '',
        eventLocation: body.eventLocation || '',
        organizationName: body.organizationName || 'Organization',
        paymentIntentId: body.paymentIntentId || '',
      })

      if(result) {
        this.logger.log(`✅ Payment confirmation email sent successfully to ${body.userEmail}`)
        return {
          success: true,
          message: 'Payment confirmation email sent!',
          messageId: result.messageId,
        }
      }else {
        this.logger.warn(`❌ Payment confirmation email failed for ${body.userEmail}`)
        return {
          success: false,
          message: 'Email failed to send (check logs)',
        }
      }
    } catch(error) {
      this.logger.error(`❌ Payment confirmation email error for ${body.userEmail}: ${error.message}`)
      return {
        success: false,
        message: `Error: ${error.message}`,
      }
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
