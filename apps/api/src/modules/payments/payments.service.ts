import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { toBuffer } from 'qrcode'
import Stripe from 'stripe'
import { DataSource, Repository } from 'typeorm'
import { uuidv7 } from 'uuidv7'
import { ApiConfigService } from '../../config/api-config.service'
import { Event } from '../events/entities/event.entity'
import { EmailService } from '../notifications/email.service'
import { NotificationsService } from '../notifications/notifications.service'
import { Organization } from '../organizations/entities/organization.entity'
import { Ticket, TicketStatus } from '../tickets/entities/ticket.entity'
import { User } from '../users/entities/user.entity'
import { OrganizationTransaction, OrganizationTransactionType } from './entities/organization-transaction.entity'
import { OrganizationVerification, OrganizationVerificationStatus } from './entities/organization-verification.entity'
import {
  OrganizationWithdrawalRequest,
  OrganizationWithdrawalStatus,
} from './entities/organization-withdrawal-request.entity'
import { Payment, PaymentStatus } from './entities/payment.entity'
import { PromoCode } from './entities/promo-code.entity'

@Injectable()
export class PaymentsService {
  private stripeInstance: Stripe | null = null
  private readonly logger = new Logger(PaymentsService.name)

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(OrganizationTransaction)
    private readonly organizationTransactionsRepository: Repository<OrganizationTransaction>,

    @InjectRepository(OrganizationWithdrawalRequest)
    private readonly organizationWithdrawalRequestsRepository: Repository<OrganizationWithdrawalRequest>,

    @InjectRepository(PromoCode)
    private readonly promoCodeRepository: Repository<PromoCode>,

    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,

    @InjectRepository(OrganizationVerification)
    private readonly organizationVerificationRepository: Repository<OrganizationVerification>,

    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,

    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly apiConfig: ApiConfigService,
    private readonly dataSource: DataSource,
  ) {}

  private normalizePromoCode(code: string): string {
    return code.trim().toUpperCase()
  }

  private isPromoCodeActive(promo: PromoCode, now = new Date()): boolean {
    if (!promo.isActive) return false
    if (promo.startsAt && now < promo.startsAt) return false
    if (promo.endsAt && now > promo.endsAt) return false
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return false
    return true
  }

  async resolveCheckoutPricing(input: { ticketId: string; quantity?: number; promoCode?: string; eventId?: string }) {
    const ticket = await this.ticketsRepository.findOne({ where: { id: input.ticketId } })
    if (!ticket) {
      throw new NotFoundException('Ticket not found')
    }

    if (ticket.user_id) {
      throw new BadRequestException('Only primary event tickets can be purchased')
    }

    if (input.eventId && ticket.event_id && input.eventId !== ticket.event_id) {
      throw new BadRequestException('Ticket does not belong to the provided event')
    }

    const quantity = Math.max(1, Math.floor(Number(input.quantity ?? 1)))
    const unitPriceCents = Math.max(0, Math.round(Number(ticket.price ?? 0) * 100))
    const subtotalCents = unitPriceCents * quantity

    let promo: Awaited<ReturnType<PaymentsService['validatePromoCode']>> | null = null
    if (input.promoCode) {
      const resolvedEventId = input.eventId ?? ticket.event_id ?? undefined
      let organizationId: string | undefined
      if (resolvedEventId) {
        const event = await this.eventsRepository.findOne({ where: { id: resolvedEventId }, select: { organization_id: true } })
        organizationId = event?.organization_id ?? undefined
      }
      promo = await this.validatePromoCode(input.promoCode, resolvedEventId, organizationId)
    }

    const discountPercent = promo?.discountPercent ?? 0
    const discountCents = Math.round(subtotalCents * (discountPercent / 100))
    const baseAmountCents = Math.max(0, subtotalCents - discountCents)

    return {
      quantity,
      promo,
      unitPriceCents,
      subtotalCents,
      discountCents,
      baseAmountCents,
    }
  }

  async validatePromoCode(code: string, eventId?: string, organizationId?: string) {
    const normalizedCode = this.normalizePromoCode(code)
    if (!normalizedCode) {
      throw new BadRequestException('Promo code is required')
    }

    const promo = await this.promoCodeRepository.findOne({ where: { code: normalizedCode } })
    if (!promo) {
      throw new NotFoundException('Promo code not found')
    }

    if (promo.eventId && eventId && promo.eventId !== eventId) {
      throw new BadRequestException('Promo code is not valid for this event')
    }

    if (promo.eventId && !eventId) {
      throw new BadRequestException('Event id is required for this promo code')
    }

    if (organizationId && promo.organizationId !== organizationId) {
      throw new BadRequestException('Promo code is not valid for this event')
    }

    if (!this.isPromoCodeActive(promo)) {
      throw new BadRequestException('Promo code is inactive or expired')
    }

    return {
      id: promo.id,
      code: promo.code,
      discountPercent: promo.discountPercent,
      organizationId: promo.organizationId,
      eventId: promo.eventId,
    }
  }

  async validatePromoCodeByEvent(code: string, eventId?: string) {
    let organizationId: string | undefined
    if (eventId) {
      const event = await this.eventsRepository.findOne({ where: { id: eventId }, select: { organization_id: true } })
      organizationId = event?.organization_id ?? undefined
    }
    return this.validatePromoCode(code, eventId, organizationId)
  }

  async listOrganizationPromoCodes(organizationId: string) {
    return await this.promoCodeRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    })
  }

  async createOrganizationPromoCode(
    organizationId: string,
    dto: {
      code: string
      discountPercent: number
      eventId?: string
      maxUses?: number | null
      startsAt?: string | null
      endsAt?: string | null
      isActive?: boolean
    },
  ) {
    const code = this.normalizePromoCode(dto.code)
    if (!code) throw new BadRequestException('Code is required')

    const discountPercent = Math.floor(Number(dto.discountPercent))
    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      throw new BadRequestException('Discount percent must be from 1 to 100')
    }

    const maxUses = dto.maxUses === undefined || dto.maxUses === null ? null : Math.floor(Number(dto.maxUses))
    if (maxUses !== null && maxUses <= 0) {
      throw new BadRequestException('maxUses must be greater than 0')
    }

    let eventId: string | null = null
    if (dto.eventId) {
      const event = await this.eventsRepository.findOne({ where: { id: dto.eventId } })
      if (!event) throw new NotFoundException('Event not found')
      if (event.organization_id !== organizationId) {
        throw new ForbiddenException('You can create promo codes only for your own events')
      }
      eventId = event.id
    }

    const existing = await this.promoCodeRepository.findOne({ where: { code } })
    if (existing) {
      throw new BadRequestException('Promo code with this code already exists')
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : null
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null
    if (startsAt && Number.isNaN(startsAt.getTime())) throw new BadRequestException('Invalid startsAt date')
    if (endsAt && Number.isNaN(endsAt.getTime())) throw new BadRequestException('Invalid endsAt date')
    if (startsAt && endsAt && startsAt > endsAt) {
      throw new BadRequestException('startsAt must be before endsAt')
    }

    const promo = this.promoCodeRepository.create({
      code,
      discountPercent,
      organizationId,
      eventId,
      maxUses,
      startsAt,
      endsAt,
      isActive: dto.isActive ?? true,
      usedCount: 0,
    })

    return this.promoCodeRepository.save(promo)
  }

  async updateOrganizationPromoCode(
    organizationId: string,
    promoId: string,
    dto: {
      discountPercent?: number
      maxUses?: number | null
      startsAt?: string | null
      endsAt?: string | null
      isActive?: boolean
    },
  ) {
    const promo = await this.promoCodeRepository.findOne({ where: { id: promoId, organizationId } })
    if (!promo) throw new NotFoundException('Promo code not found')

    if (dto.discountPercent !== undefined) {
      const discountPercent = Math.floor(Number(dto.discountPercent))
      if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
        throw new BadRequestException('Discount percent must be from 1 to 100')
      }
      promo.discountPercent = discountPercent
    }

    if (dto.maxUses !== undefined) {
      const maxUses = dto.maxUses === null ? null : Math.floor(Number(dto.maxUses))
      if (maxUses !== null && maxUses <= 0) {
        throw new BadRequestException('maxUses must be greater than 0')
      }
      promo.maxUses = maxUses
    }

    if (dto.startsAt !== undefined) {
      promo.startsAt = dto.startsAt ? new Date(dto.startsAt) : null
      if (promo.startsAt && Number.isNaN(promo.startsAt.getTime())) {
        throw new BadRequestException('Invalid startsAt date')
      }
    }

    if (dto.endsAt !== undefined) {
      promo.endsAt = dto.endsAt ? new Date(dto.endsAt) : null
      if (promo.endsAt && Number.isNaN(promo.endsAt.getTime())) {
        throw new BadRequestException('Invalid endsAt date')
      }
    }

    if (promo.startsAt && promo.endsAt && promo.startsAt > promo.endsAt) {
      throw new BadRequestException('startsAt must be before endsAt')
    }

    if (dto.isActive !== undefined) {
      promo.isActive = dto.isActive
    }

    return this.promoCodeRepository.save(promo)
  }

  private async consumePromoCodeUsage(metadata?: Record<string, string>) {
    const promoCodeId = metadata?.promoCodeId
    if (!promoCodeId) return

    await this.promoCodeRepository.increment({ id: promoCodeId }, 'usedCount', 1)
  }

  private async resolveOrganizationContextFromTicket(metadata?: Record<string, string>) {
    const ticketId = metadata?.ticketId
    if (!ticketId) return null

    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: ['event'],
    })

    if (!ticket?.event?.organization_id) return null

    return {
      organizationId: ticket.event.organization_id,
      eventTitle: metadata?.eventTitle || ticket.event.name || null,
      ticketTitle: metadata?.ticketName || ticket.name || null,
      quantity: Math.max(1, Number(metadata?.quantity ?? 1)),
    }
  }

  private async createOrganizationSaleTransaction(payment: Payment, metadata?: Record<string, string>) {
    const context = await this.resolveOrganizationContextFromTicket(metadata)
    if (!context) return

    const existing = await this.organizationTransactionsRepository.findOne({
      where: {
        sourcePaymentIntentId: payment.stripePaymentIntentId,
        type: OrganizationTransactionType.SALE,
      },
    })
    if (existing) return

    if (!payment.organizationId) {
      payment.organizationId = context.organizationId
      await this.paymentRepository.save(payment)
    }

    const baseAmountFromMetadata = payment.metadata?.baseAmountCents
      ? Number(payment.metadata.baseAmountCents) / 100
      : Number(payment.amount)

    const transaction = this.organizationTransactionsRepository.create({
      organizationId: context.organizationId,
      type: OrganizationTransactionType.SALE,
      amount: baseAmountFromMetadata,
      currency: payment.currency,
      sourcePaymentId: payment.id,
      sourcePaymentIntentId: payment.stripePaymentIntentId,
      sourceWithdrawalRequestId: null,
      eventTitle: context.eventTitle,
      ticketTitle: context.ticketTitle,
      quantity: context.quantity,
      note: 'Ticket sale income',
      metadata: payment.metadata ?? null,
    })

    await this.organizationTransactionsRepository.save(transaction)
  }

  private async createOrganizationRefundTransaction(payment: Payment) {
    const organizationId =
      payment.organizationId || (await this.resolveOrganizationContextFromTicket(payment.metadata))?.organizationId
    if (!organizationId) return

    const existing = await this.organizationTransactionsRepository.findOne({
      where: {
        sourcePaymentIntentId: payment.stripePaymentIntentId,
        type: OrganizationTransactionType.REFUND,
      },
    })
    if (existing) return

    const baseAmountFromMetadata = payment.metadata?.baseAmountCents
      ? Number(payment.metadata.baseAmountCents) / 100
      : Number(payment.amount)

    const transaction = this.organizationTransactionsRepository.create({
      organizationId,
      type: OrganizationTransactionType.REFUND,
      amount: -Math.abs(baseAmountFromMetadata),
      currency: payment.currency,
      sourcePaymentId: payment.id,
      sourcePaymentIntentId: payment.stripePaymentIntentId,
      sourceWithdrawalRequestId: null,
      eventTitle: payment.metadata?.eventTitle ?? null,
      ticketTitle: payment.metadata?.ticketName ?? null,
      quantity: payment.metadata?.quantity ? Math.max(1, Number(payment.metadata.quantity)) : null,
      note: 'Payment refunded',
      metadata: payment.metadata ?? null,
    })

    await this.organizationTransactionsRepository.save(transaction)
  }

  private async getOrganizationBalance(organizationId: string, currency: string) {
    const raw = await this.organizationTransactionsRepository
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount), 0)', 'balance')
      .addSelect('COALESCE(SUM(CASE WHEN tx.amount > 0 THEN tx.amount ELSE 0 END), 0)', 'earned')
      .addSelect('COALESCE(SUM(CASE WHEN tx.amount < 0 THEN -tx.amount ELSE 0 END), 0)', 'withdrawn')
      .where('tx.organizationId = :organizationId', { organizationId })
      .andWhere('tx.currency = :currency', { currency })
      .getRawOne<{ balance: string; earned: string; withdrawn: string }>()

    return {
      available: Number(raw?.balance ?? 0),
      totalEarned: Number(raw?.earned ?? 0),
      totalWithdrawn: Number(raw?.withdrawn ?? 0),
    }
  }

  async getOrganizationWallet(organizationId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1)
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20))

    const [transactions, total] = await this.organizationTransactionsRepository.findAndCount({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    })

    const [withdrawals, pendingWithdrawalsCount] = await Promise.all([
      this.organizationWithdrawalRequestsRepository.find({
        where: { organizationId },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.organizationWithdrawalRequestsRepository.count({
        where: { organizationId, status: OrganizationWithdrawalStatus.PENDING },
      }),
    ])

    const currency = transactions[0]?.currency || this.apiConfig.paymentCurrency.toUpperCase()
    const balance = await this.getOrganizationBalance(organizationId, currency)

    const verification = await this.getOrganizationVerification(organizationId)

    return {
      balance: {
        currency,
        ...balance,
      },
      transactions,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
      withdrawals,
      pendingWithdrawalsCount,
      verification,
    }
  }

  async getOrganizationVerification(organizationId: string) {
    let verification = await this.organizationVerificationRepository.findOne({ where: { organizationId } })

    if (!verification) {
      verification = this.organizationVerificationRepository.create({
        organizationId,
        status: OrganizationVerificationStatus.NOT_SUBMITTED,
        additionalInformation: null,
        documentUrls: [],
        submittedAt: null,
        reviewedAt: null,
        reviewerComment: null,
      })
      verification = await this.organizationVerificationRepository.save(verification)
    }

    return verification
  }

  async submitOrganizationVerification(
    organizationId: string,
    payload: {
      additionalInformation?: string
      documentUrls: string[]
    },
  ) {
    if (!payload.documentUrls?.length) {
      throw new BadRequestException('At least one verification document is required')
    }

    const verification = await this.getOrganizationVerification(organizationId)
    const now = new Date()

    verification.additionalInformation = payload.additionalInformation?.trim() || null
    verification.documentUrls = payload.documentUrls
    verification.status = OrganizationVerificationStatus.SUBMITTED
    verification.submittedAt = now
    verification.reviewedAt = null
    verification.reviewerComment = null

    return this.organizationVerificationRepository.save(verification)
  }

  async cancelOrganizationVerification(organizationId: string) {
    const verification = await this.getOrganizationVerification(organizationId)

    if (verification.status !== OrganizationVerificationStatus.SUBMITTED) {
      throw new BadRequestException('Only pending verifications can be cancelled')
    }

    verification.status = OrganizationVerificationStatus.NOT_SUBMITTED
    verification.documentUrls = []
    verification.additionalInformation = null
    verification.submittedAt = null
    verification.reviewedAt = null
    verification.reviewerComment = null

    return this.organizationVerificationRepository.save(verification)
  }

  async createOrganizationWithdrawalRequest(
    organizationId: string,
    dto: {
      amount: number
      destination: string
      comment?: string
      currency?: string
    },
  ) {
    const verification = await this.getOrganizationVerification(organizationId)
    if (verification.status !== OrganizationVerificationStatus.APPROVED) {
      throw new ForbiddenException(
        'Organization verification is required and must be approved before requesting withdrawals',
      )
    }

    const amount = Number(dto.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number')
    }

    if (!dto.destination?.trim()) {
      throw new BadRequestException('Destination is required')
    }

    const currency = (dto.currency ?? this.apiConfig.paymentCurrency).toUpperCase()
    const balance = await this.getOrganizationBalance(organizationId, currency)
    if (amount > balance.available) {
      throw new BadRequestException('Insufficient available balance for this withdrawal request')
    }

    const savedRequest = await this.dataSource.transaction(async (manager) => {
      const request = manager.create(OrganizationWithdrawalRequest, {
        organizationId,
        amount,
        currency,
        destination: dto.destination.trim(),
        comment: dto.comment?.trim() || null,
        status: OrganizationWithdrawalStatus.PENDING,
        adminComment: null,
        processedAt: null,
      })
      const savedWithdrawal = await manager.save(OrganizationWithdrawalRequest, request)

      const withdrawalTransaction = manager.create(OrganizationTransaction, {
        organizationId,
        type: OrganizationTransactionType.WITHDRAWAL_REQUEST,
        amount: -Math.abs(amount),
        currency,
        sourcePaymentId: null,
        sourcePaymentIntentId: null,
        sourceWithdrawalRequestId: savedWithdrawal.id,
        eventTitle: null,
        ticketTitle: null,
        quantity: null,
        note: dto.comment?.trim() || 'Withdrawal request created',
        metadata: {
          destination: dto.destination.trim(),
        },
      })
      await manager.save(OrganizationTransaction, withdrawalTransaction)

      return savedWithdrawal
    })

    return savedRequest
  }

  private async markTicketAsSold(metadata?: Record<string, string>) {
    const ticketId = metadata?.ticketId
    if (!ticketId) return

    const quantity = Math.max(1, Number(metadata?.quantity ?? 1))

    // Atomic conditional increment — avoids race condition from read-modify-save.
    // Only increments when stock is unlimited OR there is sufficient remaining capacity.
    const result = await this.ticketsRepository
      .createQueryBuilder()
      .update()
      .set({ quantity_sold: () => `quantity_sold + ${quantity}` })
      .where('id = :id', { id: ticketId })
      .andWhere('(quantity_limited = false OR quantity_total IS NULL OR quantity_sold + :qty <= quantity_total)', {
        qty: quantity,
      })
      .execute()

    if (result.affected === 0) {
      this.logger.warn(`Could not increment quantity_sold for ticket ${ticketId}: not found or insufficient stock`)
    }
  }

  private async createOrganizationPurchaseNotification(metadata?: Record<string, string>, paymentIntentId?: string) {
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
    const buyerName = metadata?.userName || 'A customer'

    // Create in-app notification via service (which also fires push for org if enabled)
    await this.notificationsService.create({
      name: 'New ticket purchase',
      content: `${buyerName} bought ${quantity} × ${ticketName} for ${eventTitle}.`,
      user_id: null,
      organization_id: organizationId,
      link: null,
    })

    // Send org email if org has email notifications enabled
    const org = await this.organizationsRepository.findOne({
      where: { id: organizationId },
      select: ['id', 'email', 'name', 'notifications_enabled'],
    })
    if (org?.notifications_enabled && org.email) {
      this.emailService
        .sendNewAttendeeEmail(
          org.email,
          org.name ?? 'Organization',
          buyerName,
          eventTitle,
          ticketName,
          quantity,
          paymentIntentId || 'N/A',
        )
        .catch((e: Error) =>
          this.logger.warn(`Failed to send new attendee email to org ${organizationId}: ${e.message}`),
        )
    }
  }

  private buildTicketPaymentMarker(paymentIntentId: string): string {
    return `[paymentIntent:${paymentIntentId}]`
  }

  private appendPaymentMarker(privateInfo: string | null, paymentIntentId: string): string {
    const marker = this.buildTicketPaymentMarker(paymentIntentId)
    if (!privateInfo?.trim()) return marker
    if (privateInfo.includes(marker)) return privateInfo
    return `${privateInfo}\n${marker}`
  }

  private async issuePurchasedTickets(
    metadata: Record<string, string> | undefined,
    paymentIntentId: string,
    explicitUserId?: string,
  ) {
    const ticketId = metadata?.ticketId
    const userEmail = metadata?.userEmail
    if (!ticketId) return

    const sourceTicket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: ['event'],
    })
    if (!sourceTicket) {
      this.logger.warn(`Source ticket ${ticketId} not found while issuing purchased tickets`)
      return
    }

    const user = explicitUserId
      ? await this.usersRepository.findOne({ where: { id: explicitUserId } })
      : userEmail
        ? await this.usersRepository.findOne({ where: { email: userEmail } })
        : null

    if (!user) {
      this.logger.warn(
        `Could not resolve user for payment ${paymentIntentId}; purchased tickets were not attached to a profile`,
      )
      return
    }

    const quantity = Math.max(1, Number(metadata?.quantity ?? 1))
    const marker = this.buildTicketPaymentMarker(paymentIntentId)
    const existingIssuedCount = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .where('ticket.user_id = :userId', { userId: user.id })
      .andWhere('ticket.status = :status', { status: TicketStatus.PAID })
      .andWhere('ticket.event_id = :eventId', { eventId: sourceTicket.event_id })
      .andWhere('ticket.name = :name', { name: sourceTicket.name })
      .andWhere('ticket.private_info LIKE :marker', { marker: `%${marker}%` })
      .getCount()

    const missingCount = Math.max(0, quantity - existingIssuedCount)
    if (missingCount === 0) return

    const purchasedTickets = Array.from({ length: missingCount }).map(() =>
      this.ticketsRepository.create({
        image: sourceTicket.image,
        name: sourceTicket.name,
        status: TicketStatus.PAID,
        description: sourceTicket.description,
        datetime_start: sourceTicket.datetime_start,
        datetime_end: sourceTicket.datetime_end,
        price: sourceTicket.price,
        quantity_limited: false,
        quantity_total: null,
        quantity_sold: 0,
        private_info: this.appendPaymentMarker(sourceTicket.private_info, paymentIntentId),
        user_id: user.id,
        event_id: sourceTicket.event_id,
      }),
    )

    await this.dataSource.transaction(async (manager) => {
      await manager.save(Ticket, purchasedTickets)
    })
  }

  private hasSaleTransaction(paymentIntentId: string): Promise<boolean> {
    return this.organizationTransactionsRepository.exists({
      where: {
        sourcePaymentIntentId: paymentIntentId,
        type: OrganizationTransactionType.SALE,
      },
    })
  }

  private async markPaymentEffectApplied(payment: Payment, effectKey: string) {
    payment.metadata = {
      ...(payment.metadata ?? {}),
      [effectKey]: 'true',
    }
    await this.paymentRepository.save(payment)
  }

  private isPaymentEffectApplied(payment: Payment, effectKey: string): boolean {
    return payment.metadata?.[effectKey] === 'true'
  }

  private async applySucceededPaymentSideEffects(payment: Payment, paymentIntentId: string) {
    if (this.isPaymentEffectApplied(payment, 'sideEffectsApplied')) {
      return
    }

    if (!this.isPaymentEffectApplied(payment, 'saleSideEffectApplied')) {
      const saleAlreadyCreated = await this.hasSaleTransaction(paymentIntentId)
      if (!saleAlreadyCreated) {
        await this.createOrganizationSaleTransaction(payment, payment.metadata)
      }
      await this.markPaymentEffectApplied(payment, 'saleSideEffectApplied')
    }

    if (!this.isPaymentEffectApplied(payment, 'promoUsageSideEffectApplied')) {
      await this.consumePromoCodeUsage(payment.metadata)
      await this.markPaymentEffectApplied(payment, 'promoUsageSideEffectApplied')
    }

    if (!this.isPaymentEffectApplied(payment, 'ticketStockSideEffectApplied')) {
      await this.markTicketAsSold(payment.metadata)
      await this.markPaymentEffectApplied(payment, 'ticketStockSideEffectApplied')
    }

    if (!this.isPaymentEffectApplied(payment, 'orgNotificationSideEffectApplied')) {
      await this.createOrganizationPurchaseNotification(payment.metadata, paymentIntentId)
      await this.markPaymentEffectApplied(payment, 'orgNotificationSideEffectApplied')
    }

    await this.markPaymentEffectApplied(payment, 'sideEffectsApplied')
  }

  private resolveStripeStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
    switch (status) {
      case 'succeeded':
        return PaymentStatus.SUCCEEDED
      case 'processing':
        return PaymentStatus.PROCESSING
      case 'canceled':
        return PaymentStatus.CANCELED
      default:
        return PaymentStatus.PENDING
    }
  }

  async reconcilePurchasedTicketsForUser(paymentIntentId: string, userId: string) {
    let payment = await this.paymentRepository.findOne({ where: { stripePaymentIntentId: paymentIntentId } })

    if (!payment) {
      const paymentIntent = await this.getPaymentIntent(paymentIntentId)
      payment = this.paymentRepository.create({
        id: uuidv7(),
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        status: this.resolveStripeStatus(paymentIntent.status),
        metadata: paymentIntent.metadata,
      })
      payment = await this.paymentRepository.save(payment)
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      const paymentIntent = await this.getPaymentIntent(paymentIntentId)
      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException('Payment is not succeeded yet')
      }

      payment.status = PaymentStatus.SUCCEEDED
      payment.metadata = paymentIntent.metadata
      payment = await this.paymentRepository.save(payment)
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const emailFromPayment = payment.metadata?.userEmail?.toLowerCase()
    if (!emailFromPayment || user.email.toLowerCase() !== emailFromPayment) {
      throw new ForbiddenException('This payment does not belong to the current user')
    }

    if (!payment.userId) {
      payment.userId = user.id
      await this.paymentRepository.save(payment)
    }

    await this.applySucceededPaymentSideEffects(payment, paymentIntentId)

    await this.issuePurchasedTickets(payment.metadata, paymentIntentId, userId)

    // Send confirmation email unless the user has opted out.
    // The webhook path handles the same email; guard with a idempotency flag so it
    // is sent exactly once even if both paths execute for the same payment.
    if (!this.isPaymentEffectApplied(payment, 'confirmationEmailSent') && user.payment_email_enabled) {
      const meta = payment.metadata ?? {}
      if (meta.userEmail && meta.userName) {
        this.buildTicketPdfBuffer(
          paymentIntentId,
          user.email,
          meta,
          Number(payment.amount),
          payment.currency || this.apiConfig.paymentCurrency.toUpperCase(),
          payment.createdAt ? new Date(payment.createdAt) : undefined,
        )
          .then((ticketPdf) =>
            this.emailService.sendPaymentConfirmation({
              userEmail: meta.userEmail,
              userName: meta.userName,
              eventTitle: meta.eventTitle || 'Ticket Purchase',
              ticketName: meta.ticketName || 'Ticket',
              price: Number(payment.amount),
              eventDate: meta.eventDate || '',
              eventLocation: meta.eventLocation || '',
              organizationName: meta.organizationName || '',
              paymentIntentId,
              ticketPdf,
            }),
          )
          .then(() => this.markPaymentEffectApplied(payment, 'confirmationEmailSent'))
          .catch((e: Error) =>
            this.logger.warn(
              `Failed to send confirmation email for reconciled payment ${paymentIntentId}: ${e.message}`,
            ),
          )
      }
    }

    return { success: true, walletUpdated: true }
  }

  findStoredPaymentByIntentId(paymentIntentId: string) {
    return this.paymentRepository.findOne({ where: { stripePaymentIntentId: paymentIntentId } })
  }

  private async buildTicketPdfBuffer(
    paymentIntentId: string,
    userEmail: string,
    metadata: Record<string, string>,
    amount: number,
    currency: string,
    createdAt?: Date,
  ): Promise<{ buffer: Buffer; fileName: string } | undefined> {
    try {
      const eventTitle = metadata.eventTitle || 'Event'
      const ticketName = metadata.ticketName || 'Ticket'
      const quantity = Math.max(1, Number(metadata.quantity ?? 1))
      const amountLine = `${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'} ${currency}`
      const purchaseDate = createdAt ?? new Date()

      const qrPayload = JSON.stringify({
        paymentIntentId,
        eventTitle,
        ticketName,
        quantity,
        amount: Number.isFinite(amount) ? amount : 0,
        currency,
        userEmail,
        issuedAt: purchaseDate.toISOString(),
      })

      const qrPng = await toBuffer(qrPayload, { type: 'png', width: 220, margin: 1 })

      const pdf = await PDFDocument.create()
      const page = pdf.addPage([595.28, 841.89])
      const regular = await pdf.embedFont(StandardFonts.Helvetica)
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
      const qrImage = await pdf.embedPng(qrPng)

      const { width, height } = page.getSize()
      const margin = 48

      page.drawRectangle({
        x: margin,
        y: height - 235,
        width: width - margin * 2,
        height: 180,
        color: rgb(0.96, 0.98, 1),
        borderColor: rgb(0.12, 0.32, 0.62),
        borderWidth: 1,
      })

      page.drawText('UEVENT TICKET', {
        x: margin + 16,
        y: height - 90,
        size: 24,
        font: bold,
        color: rgb(0.08, 0.18, 0.38),
      })

      page.drawText(`Order: ${paymentIntentId}`, {
        x: margin + 16,
        y: height - 122,
        size: 11,
        font: regular,
        color: rgb(0.22, 0.28, 0.36),
      })

      const lines: [string, string][] = [
        ['Event', eventTitle],
        ['Ticket', ticketName],
        ['Quantity', String(quantity)],
        ['Paid', amountLine],
        ['Buyer', userEmail],
        ['Issued', purchaseDate.toISOString().slice(0, 19).replace('T', ' ')],
      ]

      let y = height - 290
      for (const [label, value] of lines) {
        page.drawText(`${label}:`, { x: margin, y, size: 12, font: bold, color: rgb(0.14, 0.16, 0.2) })
        page.drawText(value, { x: margin + 90, y, size: 12, font: regular, color: rgb(0.14, 0.16, 0.2) })
        y -= 24
      }

      const qrSize = 170
      page.drawImage(qrImage, { x: width - margin - qrSize, y: 120, width: qrSize, height: qrSize })
      page.drawText('QR verification data', {
        x: width - margin - qrSize,
        y: 100,
        size: 10,
        font: regular,
        color: rgb(0.35, 0.38, 0.44),
      })

      const bytes = await pdf.save()
      return { buffer: Buffer.from(bytes), fileName: `uevent-ticket-${paymentIntentId}.pdf` }
    } catch (err: unknown) {
      this.logger.warn(`Could not generate ticket PDF for ${paymentIntentId}: ${(err as Error).message}`)
      return undefined
    }
  }

  async buildTicketPdfForUser(paymentIntentId: string, userId: string) {
    const payment = await this.paymentRepository.findOne({ where: { stripePaymentIntentId: paymentIntentId } })
    if (!payment) {
      throw new NotFoundException('Payment not found')
    }
    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Payment is not succeeded yet')
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const emailFromPayment = payment.metadata?.userEmail?.toLowerCase()
    if (!emailFromPayment || user.email.toLowerCase() !== emailFromPayment) {
      throw new ForbiddenException('This payment does not belong to the current user')
    }

    const metadata = payment.metadata ?? {}
    const eventTitle = metadata.eventTitle || 'Event'
    const ticketName = metadata.ticketName || 'Ticket'
    const quantity = Math.max(1, Number(metadata.quantity ?? 1))
    const currency = payment.currency || this.apiConfig.paymentCurrency.toUpperCase()
    const amountValue = Number(payment.amount)
    const amountLine = `${Number.isFinite(amountValue) ? amountValue.toFixed(2) : '0.00'} ${currency}`
    const purchaseDate = payment.createdAt ? new Date(payment.createdAt) : new Date()

    const qrPayload = JSON.stringify({
      paymentIntentId,
      eventTitle,
      ticketName,
      quantity,
      amount: Number.isFinite(amountValue) ? amountValue : 0,
      currency,
      userEmail: user.email,
      issuedAt: purchaseDate.toISOString(),
    })

    const qrPng = await toBuffer(qrPayload, { type: 'png', width: 220, margin: 1 })

    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595.28, 841.89])
    const regular = await pdf.embedFont(StandardFonts.Helvetica)
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
    const qrImage = await pdf.embedPng(qrPng)

    const { width, height } = page.getSize()
    const margin = 48

    page.drawRectangle({
      x: margin,
      y: height - 235,
      width: width - margin * 2,
      height: 180,
      color: rgb(0.96, 0.98, 1),
      borderColor: rgb(0.12, 0.32, 0.62),
      borderWidth: 1,
    })

    page.drawText('UEVENT TICKET', {
      x: margin + 16,
      y: height - 90,
      size: 24,
      font: bold,
      color: rgb(0.08, 0.18, 0.38),
    })

    page.drawText(`Order: ${paymentIntentId}`, {
      x: margin + 16,
      y: height - 122,
      size: 11,
      font: regular,
      color: rgb(0.22, 0.28, 0.36),
    })

    const lines = [
      ['Event', eventTitle],
      ['Ticket', ticketName],
      ['Quantity', String(quantity)],
      ['Paid', amountLine],
      ['Buyer', user.email],
      ['Issued', purchaseDate.toISOString().slice(0, 19).replace('T', ' ')],
    ]

    let y = height - 290
    for (const [label, value] of lines) {
      page.drawText(`${label}:`, {
        x: margin,
        y,
        size: 12,
        font: bold,
        color: rgb(0.14, 0.16, 0.2),
      })

      page.drawText(value, {
        x: margin + 90,
        y,
        size: 12,
        font: regular,
        color: rgb(0.14, 0.16, 0.2),
      })

      y -= 24
    }

    const qrSize = 170
    page.drawImage(qrImage, {
      x: width - margin - qrSize,
      y: 120,
      width: qrSize,
      height: qrSize,
    })

    page.drawText('QR verification data', {
      x: width - margin - qrSize,
      y: 100,
      size: 10,
      font: regular,
      color: rgb(0.35, 0.38, 0.44),
    })

    const bytes = await pdf.save()

    return {
      fileName: `uevent-ticket-${paymentIntentId}.pdf`,
      buffer: Buffer.from(bytes),
    }
  }

  async createFreeCheckout(metadata?: Record<string, string>, currency?: string) {
    const paymentIntentId = `free_${uuidv7()}`
    const resolvedCurrency = (currency ?? this.apiConfig.paymentCurrency).toUpperCase()

    const payment = this.paymentRepository.create({
      id: uuidv7(),
      stripePaymentIntentId: paymentIntentId,
      amount: 0,
      currency: resolvedCurrency,
      status: PaymentStatus.SUCCEEDED,
      metadata: {
        ...(metadata ?? {}),
        baseAmountCents: '0',
        platformFeeCents: '0',
      },
    })

    const savedPayment = await this.paymentRepository.save(payment)
    await this.applySucceededPaymentSideEffects(savedPayment, paymentIntentId)
    await this.issuePurchasedTickets(savedPayment.metadata, paymentIntentId)

    // Send confirmation email for free checkout
    const freeMetadata = savedPayment.metadata ?? {}
    if (freeMetadata.userEmail && freeMetadata.userName) {
      const freeUser = await this.usersRepository.findOne({ where: { email: freeMetadata.userEmail } })
      if (!freeUser || freeUser.payment_email_enabled) {
        this.buildTicketPdfBuffer(
          paymentIntentId,
          freeMetadata.userEmail,
          freeMetadata,
          0,
          savedPayment.currency,
          savedPayment.createdAt ? new Date(savedPayment.createdAt) : undefined,
        )
          .then((ticketPdf) =>
            this.emailService.sendPaymentConfirmation({
              userEmail: freeMetadata.userEmail,
              userName: freeMetadata.userName,
              eventTitle: freeMetadata.eventTitle || 'Ticket Purchase',
              ticketName: freeMetadata.ticketName || 'Ticket',
              price: 0,
              eventDate: freeMetadata.eventDate || '',
              eventLocation: freeMetadata.eventLocation || '',
              organizationName: freeMetadata.organizationName || '',
              paymentIntentId,
              ticketPdf,
            }),
          )
          .catch((e) => this.logger.warn(`Failed to send free checkout confirmation email: ${e.message}`))
      }
    }

    return {
      id: paymentIntentId,
      client_secret: null,
    }
  }

  private getStripe(): Stripe {
    if (!this.stripeInstance) {
      const apiKey = this.apiConfig.stripeConfig.secretKey

      if (!apiKey) throw new BadRequestException('STRIPE_SECRET_KEY is not set in environment variables')

      this.stripeInstance = new Stripe(apiKey)
    }
    return this.stripeInstance
  }

  getPlatformFeeCents(): number {
    return this.apiConfig.stripePlatformFeeCents
  }

  async resolveUserIdentity(userId: string): Promise<{ email: string; name: string }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: { email: true, first_name: true, last_name: true, username: true },
    })
    if (!user) return { email: '', name: '' }
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || ''
    return { email: user.email, name }
  }

  async createPaymentIntent(amount: number, currency?: string, metadata?: Record<string, string>) {
    try {
      const resolvedCurrency = (currency ?? this.apiConfig.paymentCurrency).toLowerCase()
      const baseAmount = Math.round(amount)
      const platformFee = baseAmount > 0 ? this.getPlatformFeeCents() : 0
      const totalAmount = baseAmount + platformFee

      const paymentIntent = await this.getStripe().paymentIntents.create({
        amount: totalAmount,
        currency: resolvedCurrency,
        metadata: {
          ...(metadata || {}),
          baseAmountCents: String(baseAmount),
          platformFeeCents: String(platformFee),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      this.logger.log(`Payment Intent created: ${paymentIntent.id}`)
      return paymentIntent
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`)
      throw new BadRequestException('Failed to create payment intent')
    }
  }

  async getPaymentIntent(paymentIntentId: string) {
    try {
      return await this.getStripe().paymentIntents.retrieve(paymentIntentId)
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent: ${error.message}`)
      throw new BadRequestException('Payment intent not found')
    }
  }

  handleWebhookEvent(event: Stripe.Event) {
    this.logger.log(`Received event: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded':
        return this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)

      case 'payment_intent.payment_failed':
        return this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)

      case 'charge.refunded':
        return this.handleChargeRefunded(event.data.object as Stripe.Charge)

      default:
        this.logger.warn(`Unhandled event type: ${event.type}`)
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`WEBHOOK RECEIVED: Payment succeeded: ${paymentIntent.id}`)
    this.logger.log(`Payment method type: ${paymentIntent.payment_method_types[0] || 'unknown'}`)

    let payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    })

    const alreadySucceeded = payment?.status === PaymentStatus.SUCCEEDED

    if (!payment) {
      payment = this.paymentRepository.create({
        id: uuidv7(),
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

    if (alreadySucceeded) {
      this.logger.log(`Payment ${paymentIntent.id} already processed as succeeded; ensuring side effects are complete`)
    }

    await this.applySucceededPaymentSideEffects(payment, paymentIntent.id)
    // Use server-stored userId from metadata when available; fall back to email lookup for guest checkout
    const explicitUserId = paymentIntent.metadata?.userId || undefined
    await this.issuePurchasedTickets(paymentIntent.metadata, paymentIntent.id, explicitUserId)

    this.logger.log(`Payment ${paymentIntent.id} processed`)

    // payment confirmation email (failures must not bubble — email is non-critical)
    if (paymentIntent.metadata) {
      await this.sendPaymentConfirmationEmail(paymentIntent).catch((e: Error) =>
        this.logger.error(`Failed to send payment confirmation email for ${paymentIntent.id}: ${e.message}`),
      )
    } else {
      this.logger.warn(`No metadata found - skipping email`)
    }
  }

  private async sendPaymentConfirmationEmail(paymentIntent: Stripe.PaymentIntent) {
    try {
      const metadata = paymentIntent.metadata

      if (!metadata?.userEmail || !metadata?.userName) {
        this.logger.warn(`Missing required email data for payment ${paymentIntent.id}`)
        return
      }

      // Check user preference for payment emails
      const user = await this.usersRepository.findOne({ where: { email: metadata.userEmail } })
      if (user && !user.payment_email_enabled) {
        this.logger.log(`Payment email disabled — skipping confirmation`)
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

      this.logger.log(`Payment confirmation email sent for payment ${paymentIntent.id}`)
    } catch (error) {
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

      if (!payment) {
        payment = this.paymentRepository.create({
          id: uuidv7(),
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

      // send failed payment email
      const failedUserEmail = paymentIntent.metadata?.userEmail || payment?.metadata?.userEmail
      if (failedUserEmail) {
        const failedUser = await this.usersRepository.findOne({ where: { email: failedUserEmail } })
        if (!failedUser || failedUser.payment_email_enabled) {
          const meta = paymentIntent.metadata?.userEmail ? paymentIntent.metadata : (payment?.metadata ?? {})
          this.logger.log(`Sending failed payment email for payment ${paymentIntent.id}`)
          await this.emailService.sendPaymentFailedEmail(
            failedUserEmail,
            meta.userName || 'Valued Customer',
            meta.eventTitle || 'Ticket Purchase',
            meta.ticketName || 'Ticket',
            failureReason,
            paymentIntent.id,
          )
        } else {
          this.logger.log(`Payment email disabled — skipping failed email`)
        }
      } else {
        this.logger.warn(`No email found in webhook metadata or database - skipping failed payment email`)
      }
    } catch (error: unknown) {
      this.logger.error(`Error handling payment failure: ${(error as Error).message}`)
      throw error
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    try {
      this.logger.log(`Charge refunded: ${charge.id}`)

      const paymentIntentId = charge.payment_intent?.toString()

      if (paymentIntentId) {
        const payment = await this.paymentRepository.findOne({
          where: { stripePaymentIntentId: paymentIntentId },
        })

        if (payment) {
          payment.status = PaymentStatus.REFUNDED
          payment.metadata = {
            ...payment.metadata,
            refundedAt: new Date().toISOString(),
            chargeId: charge.id,
          }

          await this.paymentRepository.save(payment)

          await this.createOrganizationRefundTransaction(payment)

          this.logger.log(`Payment ${paymentIntentId} marked as refunded`)

          // send refund email
          if (payment.metadata?.userEmail) {
            const refundUser = await this.usersRepository.findOne({ where: { email: payment.metadata.userEmail } })
            if (!refundUser || refundUser.payment_email_enabled) {
              this.logger.log(`Sending refund email for payment ${paymentIntentId}`)
              await this.emailService.sendRefundEmail(
                payment.metadata.userEmail,
                payment.metadata.userName,
                payment.metadata.eventTitle || 'Ticket Purchase',
                payment.metadata.ticketName || 'Ticket',
                payment.amount,
                paymentIntentId,
              )
            } else {
              this.logger.log(`Payment email disabled for payer — skipping refund email`)
            }
          } else {
            this.logger.warn(`No metadata found - skipping refund email`)
          }
        }
      } else {
        this.logger.warn(`Could not find payment for charge ${charge.id}`)
      }
    } catch (error: unknown) {
      this.logger.error(`Error handling charge refund: ${(error as Error).message}`)
      throw error
    }
  }

  async buildTicketPdfByTicketForUser(ticketId: string, userId: string) {
    const ticket = await this.ticketsRepository.findOne({ where: { id: ticketId } })
    if (!ticket) {
      throw new NotFoundException('Ticket not found')
    }
    if (ticket.user_id !== userId) {
      throw new ForbiddenException('This ticket does not belong to the current user')
    }
    const match = ticket.private_info?.match(/\[paymentIntent:([^\]]+)\]/)
    if (!match) {
      throw new BadRequestException('No payment associated with this ticket')
    }
    return this.buildTicketPdfForUser(match[1], userId)
  }

  constructWebhookEvent(body: Buffer | Record<string, unknown>, signature: string, secret: string): Stripe.Event {
    try {
      const bodyToUse = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)
      return this.getStripe().webhooks.constructEvent(bodyToUse, signature, secret)
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`)
      throw new BadRequestException('Webhook signature verification failed')
    }
  }
}
