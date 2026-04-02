import { Controller, Post, Get, Delete, Body, Param, Headers, RawBodyRequest, Req, Res, HttpCode, Logger, BadRequestException, ForbiddenException, InternalServerErrorException, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
import { Request, Response } from 'express'
import { PaymentsService } from './payments.service'
import { EmailService } from '../notifications/email.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/entities/user.entity'
import Stripe from 'stripe'
import { ApiConfigService } from '../../config/api-config.service'
import { JwtGuard } from '../auth/guards/jwt.guard'
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard'
import { ApiBody, ApiExtraModels, ApiHeader, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ApiAccessCookieAuth, createPaymentIntentResponseSchema, emailSendResultSchema, paymentConfigResponseSchema, paymentIntentStatusResponseSchema } from '../../common/swagger/openapi.util'
import { Payment } from './entities/payment.entity'
import { DEFAULT_PAYMENT_CURRENCY } from '../../config/env.schema'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtPayload } from '../auth/types/jwt-payload.interface'
import { FilesInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

@Controller('payments')
@ApiTags('Payments')
@ApiExtraModels(Payment)
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name)

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly emailService: EmailService,
    private readonly apiConfig: ApiConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Get public payment configuration' })
  @ApiOkResponse({ description: 'Payment configuration.', schema: paymentConfigResponseSchema })
  getPaymentConfig() {
    const platformFeeCents = this.paymentsService.getPlatformFeeCents()

    return {
      currencyCode: this.apiConfig.paymentCurrency,
      currencySymbol: this.apiConfig.paymentCurrencySymbol,
      platformFeeCents,
      platformFeeAmount: platformFeeCents / 100,
    }
  }

  @Post('create-intent')
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Create Stripe payment intent' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 5000 },
        currency: { type: 'string', example: DEFAULT_PAYMENT_CURRENCY },
        orderId: { type: 'string' },
        ticketId: { type: 'string', format: 'uuid' },
        quantity: { type: 'integer' },
        userEmail: { type: 'string', format: 'email' },
        userName: { type: 'string' },
        eventTitle: { type: 'string' },
        ticketName: { type: 'string' },
        eventDate: { type: 'string' },
        eventLocation: { type: 'string' },
        organizationName: { type: 'string' },
        promoCode: { type: 'string' },
        promoCodeId: { type: 'string', format: 'uuid' },
        promoDiscountPercent: { type: 'integer' },
      },
      required: ['amount'],
    },
  })
  @ApiOkResponse({ description: 'Stripe payment intent created.', schema: createPaymentIntentResponseSchema })
  async createPaymentIntent(
    @Body() body: {
    amount?: number
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
    promoCode?: string
    promoCodeId?: string
    promoDiscountPercent?: number
    eventId?: string
  },
    @CurrentUser() user?: JwtPayload,
  ) {
    if (user?.type === 'organization') {
      throw new ForbiddenException('Organization accounts cannot purchase tickets')
    }

    const {
      amount,
      currency = this.apiConfig.paymentCurrency,
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
      promoCode,
      promoCodeId,
      promoDiscountPercent,
      eventId,
    } = body

    if (!ticketId) {
      throw new BadRequestException('ticketId is required')
    }

    const pricing = await this.paymentsService.resolveCheckoutPricing({
      ticketId,
      quantity,
      promoCode,
      eventId,
    })

    if (amount !== undefined && (!Number.isFinite(amount) || Math.round(amount) !== pricing.baseAmountCents)) {
      throw new BadRequestException('Amount mismatch. Amount is calculated on server.')
    }
    if (pricing.baseAmountCents > 0 && pricing.baseAmountCents < 50) {
      throw new BadRequestException('Minimum payment amount is 50 cents.')
    }

    const metadata: Record<string, string> = {}

    if(orderId) metadata.orderId = orderId
    if(ticketId) metadata.ticketId = ticketId
    metadata.quantity = String(pricing.quantity)
    if(userEmail) metadata.userEmail = userEmail
    if(userName) metadata.userName = userName
    if(eventTitle) metadata.eventTitle = eventTitle
    if(ticketName) metadata.ticketName = ticketName
    if(eventDate) metadata.eventDate = eventDate
    if(eventLocation) metadata.eventLocation = eventLocation
    if(organizationName) metadata.organizationName = organizationName
    if (promoCode) {
      const validatedPromo = pricing.promo
      if (!validatedPromo) {
        throw new BadRequestException('Promo code is invalid')
      }
      if (promoCodeId && validatedPromo.id !== promoCodeId) {
        throw new BadRequestException('Promo code mismatch')
      }
      if (promoDiscountPercent !== undefined && validatedPromo.discountPercent !== promoDiscountPercent) {
        throw new BadRequestException('Promo discount mismatch')
      }

      metadata.promoCode = validatedPromo.code
      metadata.promoCodeId = validatedPromo.id
      metadata.promoDiscountPercent = String(validatedPromo.discountPercent)
    }

    const paymentIntent = pricing.baseAmountCents > 0
      ? await this.paymentsService.createPaymentIntent(pricing.baseAmountCents, currency, metadata)
      : await this.paymentsService.createFreeCheckout(metadata, currency)

    const platformFee = pricing.baseAmountCents > 0 ? this.paymentsService.getPlatformFeeCents() : 0
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      baseAmount: pricing.baseAmountCents,
      platformFee,
      totalAmount: pricing.baseAmountCents + platformFee,
      currencyCode: (currency ?? this.apiConfig.paymentCurrency).toLowerCase(),
      currencySymbol: this.apiConfig.paymentCurrencySymbol,
    }
  }

  @Post('promo-codes/validate')
  @ApiOperation({ summary: 'Validate promo code for checkout' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        eventId: { type: 'string', format: 'uuid' },
      },
      required: ['code'],
    },
  })
  async validatePromoCode(@Body() body: { code: string; eventId?: string }) {
    return this.paymentsService.validatePromoCode(body.code, body.eventId)
  }

  @Get('promo-codes/my')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get promo codes created by current organization' })
  @ApiAccessCookieAuth()
  async getMyPromoCodes(@CurrentUser() user: JwtPayload) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organization accounts can access promo codes')
    }
    return this.paymentsService.listOrganizationPromoCodes(user.sub)
  }

  @Post('promo-codes')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Create promo code for organization' })
  @ApiAccessCookieAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'SPRING20' },
        discountPercent: { type: 'integer', example: 20 },
        eventId: { type: 'string', format: 'uuid' },
        maxUses: { type: 'integer', nullable: true },
        startsAt: { type: 'string', format: 'date-time', nullable: true },
        endsAt: { type: 'string', format: 'date-time', nullable: true },
        isActive: { type: 'boolean' },
      },
      required: ['code', 'discountPercent'],
    },
  })
  async createPromoCode(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      code: string
      discountPercent: number
      eventId?: string
      maxUses?: number | null
      startsAt?: string | null
      endsAt?: string | null
      isActive?: boolean
    },
  ) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organization accounts can create promo codes')
    }
    return this.paymentsService.createOrganizationPromoCode(user.sub, body)
  }

  @Post('promo-codes/:id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update promo code for organization' })
  @ApiAccessCookieAuth()
  async updatePromoCode(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: {
      discountPercent?: number
      maxUses?: number | null
      startsAt?: string | null
      endsAt?: string | null
      isActive?: boolean
    },
  ) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organization accounts can update promo codes')
    }
    return this.paymentsService.updateOrganizationPromoCode(user.sub, id, body)
  }

  @Post('test-email')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Send payment confirmation test email' })
  @ApiAccessCookieAuth()
  @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } }, required: ['email'] } })
  @ApiOkResponse({ description: 'Email send result.', schema: emailSendResultSchema })
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
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Send payment confirmation email' })
  @ApiAccessCookieAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', format: 'email' },
        userName: { type: 'string' },
        eventTitle: { type: 'string' },
        ticketName: { type: 'string' },
        price: { type: 'number' },
        eventDate: { type: 'string' },
        eventLocation: { type: 'string' },
        organizationName: { type: 'string' },
        paymentIntentId: { type: 'string' },
      },
      required: ['userEmail'],
    },
  })
  @ApiOkResponse({ description: 'Email send result.', schema: emailSendResultSchema })
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

  @Get('organization/wallet')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get organization internal wallet summary and transactions' })
  @ApiAccessCookieAuth()
  async getOrganizationWallet(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organization accounts can access wallet data')
    }

    return this.paymentsService.getOrganizationWallet(user.sub, Number(page), Number(limit))
  }

  @Get('organization/verification')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get current organization verification status' })
  @ApiAccessCookieAuth()
  async getOrganizationVerification(@CurrentUser() user: JwtPayload) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organization accounts can access verification')
    }

    return this.paymentsService.getOrganizationVerification(user.sub)
  }

  @Post('organization/verification')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Submit organization verification documents and additional information' })
  @ApiAccessCookieAuth()
  @UseInterceptors(
    FilesInterceptor('documents', 10, {
      storage: diskStorage({
        destination: join(process.cwd(), 'storage', 'verifications'),
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimePrefixes = ['image/']
        const allowedMimeExact = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]
        if (!allowedMimePrefixes.some((p) => file.mimetype.startsWith(p)) && !allowedMimeExact.includes(file.mimetype)) {
          return cb(new BadRequestException('Only images, PDF, DOC and DOCX files are allowed'), false)
        }
        cb(null, true)
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        additionalInformation: { type: 'string' },
        documents: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['documents'],
    },
  })
  async submitOrganizationVerification(
    @CurrentUser() user: JwtPayload,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { additionalInformation?: string },
  ) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organization accounts can submit verification')
    }
    if (!files?.length) {
      throw new BadRequestException('No verification documents uploaded')
    }

    const documentUrls = files.map((file) => `${this.apiConfig.apiUrl}/storage/verifications/${file.filename}`)

    return this.paymentsService.submitOrganizationVerification(user.sub, {
      additionalInformation: body.additionalInformation,
      documentUrls,
    })
  }

  @Delete('organization/verification')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Cancel a pending organization verification request' })
  @ApiAccessCookieAuth()
  async cancelOrganizationVerification(@CurrentUser() user: JwtPayload) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organization accounts can cancel verification')
    }
    return this.paymentsService.cancelOrganizationVerification(user.sub)
  }

  @Get('organization/transactions')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get organization transaction history' })
  @ApiAccessCookieAuth()
  async getOrganizationTransactions(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organization accounts can access transactions')
    }

    return this.paymentsService.getOrganizationWallet(user.sub, Number(page), Number(limit))
  }

  @Post('organization/withdrawals')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Create withdrawal request for organization internal wallet' })
  @ApiAccessCookieAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 120.5 },
        destination: { type: 'string', example: 'IBAN: UA123456789012345678901234567' },
        comment: { type: 'string', example: 'Weekly payout' },
        currency: { type: 'string', example: DEFAULT_PAYMENT_CURRENCY.toUpperCase() },
      },
      required: ['amount', 'destination'],
    },
  })
  async createOrganizationWithdrawal(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      amount: number
      destination: string
      comment?: string
      currency?: string
    },
  ) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organization accounts can request withdrawals')
    }

    const request = await this.paymentsService.createOrganizationWithdrawalRequest(user.sub, body)
    return {
      success: true,
      request,
    }
  }

  @Get('ticket/:ticketId/pdf')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Download purchased ticket PDF by ticket ID' })
  @ApiAccessCookieAuth()
  @ApiParam({ name: 'ticketId', description: 'Ticket UUID', schema: { type: 'string' } })
  async downloadTicketPdfByTicketId(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    if (user.type !== 'user') {
      throw new ForbiddenException('Only user accounts can download ticket PDF')
    }

    const { fileName, buffer } = await this.paymentsService.buildTicketPdfByTicketForUser(ticketId, user.sub)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Content-Length', String(buffer.length))
    res.send(buffer)
  }

  @Post(':paymentIntentId/reconcile')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Reconcile purchased tickets for current user and payment intent' })
  @ApiAccessCookieAuth()
  @ApiParam({ name: 'paymentIntentId', description: 'Stripe payment intent id', schema: { type: 'string' } })
  async reconcilePaymentTickets(
    @Param('paymentIntentId') paymentIntentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.type !== 'user') {
      throw new ForbiddenException('Only user accounts can reconcile purchased tickets')
    }

    return this.paymentsService.reconcilePurchasedTicketsForUser(paymentIntentId, user.sub)
  }

  @Get(':paymentIntentId/ticket-pdf')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Download purchased ticket PDF with QR code' })
  @ApiAccessCookieAuth()
  @ApiParam({ name: 'paymentIntentId', description: 'Stripe payment intent id', schema: { type: 'string' } })
  async downloadTicketPdf(
    @Param('paymentIntentId') paymentIntentId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    if (user.type !== 'user') {
      throw new ForbiddenException('Only user accounts can download ticket PDF')
    }

    const { fileName, buffer } = await this.paymentsService.buildTicketPdfForUser(paymentIntentId, user.sub)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Content-Length', String(buffer.length))
    res.send(buffer)
  }

  @Get(':paymentIntentId')
  @ApiOperation({ summary: 'Get Stripe payment status' })
  @ApiParam({ name: 'paymentIntentId', description: 'Stripe payment intent id', schema: { type: 'string' } })
  @ApiOkResponse({ description: 'Payment intent status.', schema: paymentIntentStatusResponseSchema })
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    const storedPayment = await this.paymentsService.findStoredPaymentByIntentId(paymentIntentId)
    if (storedPayment) {
      return {
        status: storedPayment.status,
        amount: Number(storedPayment.amount),
        currency: storedPayment.currency.toLowerCase(),
        clientSecret: null,
      }
    }

    const paymentIntent = await this.paymentsService.getPaymentIntent(paymentIntentId)

    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      clientSecret: paymentIntent.client_secret,
    }
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiHeader({ name: 'stripe-signature', required: true, description: 'Stripe webhook signature header.' })
  @ApiOkResponse({ description: 'Webhook accepted.', schema: { type: 'object', properties: { received: { type: 'boolean' } }, required: ['received'] } })
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {

    if(!signature) {
      this.logger.error('Missing stripe-signature header')
      throw new BadRequestException('Missing stripe-signature header')
    }

    try {
      const event = this.paymentsService.constructWebhookEvent(
        req.rawBody || Buffer.from(''),
        signature,
        this.apiConfig.stripeConfig.webhookSecret,
      )

      await this.paymentsService.handleWebhookEvent(event)

      return { received: true }
    } catch(error) {
      this.logger.error(`Webhook error: ${error.message}`)
      throw new InternalServerErrorException('Webhook handling failed')
    }
  }
}
