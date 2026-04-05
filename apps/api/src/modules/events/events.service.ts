import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { ContentLocalizationService } from '../../common/localization/content-localization.service'
import { JwtPayload } from '../auth/types/jwt-payload.interface'
import { EmailService } from '../notifications/email.service'
import { Notification } from '../notifications/entities/notification.entity'
import { PushNotificationService } from '../notifications/push-notification.service'
import { Organization } from '../organizations/entities/organization.entity'
import { Tag } from '../tags/entities/tag.entity'
import { User } from '../users/entities/user.entity'
import { CreateEventDto } from './dto/create-event.dto'
import { UpdateEventDto } from './dto/update-event.dto'
import { Event } from './entities/event.entity'
import { EventComment } from './entities/event-comment.entity'
import { EventSubscription } from './entities/event-subscription.entity'
import { GetEventsParams } from './params/get-events.params'

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,

    @InjectRepository(EventSubscription)
    private readonly eventSubRepo: Repository<EventSubscription>,

    @InjectRepository(EventComment)
    private readonly eventCommentRepo: Repository<EventComment>,

    @InjectRepository(Tag)
    private readonly tagsRepo: Repository<Tag>,

    @InjectRepository(Organization)
    private readonly organizationsRepo: Repository<Organization>,

    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    private readonly contentLocalization: ContentLocalizationService,
    private readonly emailService: EmailService,
    private readonly pushService: PushNotificationService,
  ) {}

  async create({ tags, ...rest }: CreateEventDto, user: JwtPayload) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organizations can create events')
    }

    if (rest.organization_id && rest.organization_id !== user.sub) {
      throw new ForbiddenException('You can create events only for your organization')
    }

    const event = this.eventsRepo.create({ ...rest, organization_id: user.sub })

    if (tags?.length) event.tags = await this.tagsRepo.findBy({ id: In(tags) })
    const savedEvent = await this.eventsRepo.save(event)

    if (savedEvent.organization_id) {
      // Query only follower IDs that have both notification flags enabled — avoids loading all User data into memory
      const recipientIds = await this.usersRepo
        .createQueryBuilder('u')
        .select('u.id', 'id')
        .innerJoin('u.followed_organizations', 'org', 'org.id = :orgId', { orgId: savedEvent.organization_id })
        .where('u.notifications_enabled = true')
        .andWhere('u.subscription_notifications_enabled = true')
        .getRawMany<{ id: string }>()

      if (recipientIds.length > 0) {
        const orgName =
          (await this.organizationsRepo.findOne({ where: { id: savedEvent.organization_id }, select: ['name'] }))
            ?.name ?? 'An organization'
        const notifications = recipientIds.map(({ id }) =>
          this.notificationsRepo.create({
            name: 'New event from organization',
            content: `${orgName} published a new event: ${savedEvent.name}`,
            link: `/events/${savedEvent.id}`,
            user_id: id,
          }),
        )
        await this.notificationsRepo.save(notifications)

        // Fetch per-user email + push preferences in a single query
        const userPrefs = await this.usersRepo
          .createQueryBuilder('u')
          .select(['u.id', 'u.email', 'u.first_name', 'u.last_name', 'u.username', 'u.push_notifications_enabled'])
          .where('u.id IN (:...ids)', { ids: recipientIds.map((r) => r.id) })
          .getMany()

        for (const u of userPrefs) {
          const displayName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'User'
          // Web-push
          if (u.push_notifications_enabled) {
            this.pushService
              .sendToUser(u.id, {
                title: `New event from ${orgName}`,
                body: savedEvent.name,
                url: `/events/${savedEvent.id}`,
              })
              .catch(() => undefined)
          }
          // Email
          if (u.email) {
            this.emailService
              .sendSubscriptionNotificationEmail(u.email, displayName, orgName, savedEvent.name, savedEvent.id)
              .catch(() => undefined)
          }
        }
      }
    }

    return savedEvent
  }

  private async findOneEntity(id: string) {
    const event = await this.eventsRepo.findOne({
      where: { id },
      relations: ['tags', 'tickets', 'tickets.user', 'organization', 'recurrence', 'recurrence.overrides'],
    })

    if (!event) throw new NotFoundException(`Event with id #${id} not found`)
    return event
  }

  async findAll(query: GetEventsParams, acceptLanguage?: string) {
    const {
      page,
      limit,
      search,
      format,
      tags,
      date_from,
      date_to,
      location,
      location_from,
      location_to,
      organization_id,
      user_id,
      sort_by,
      sort_order,
    } = query
    const now = new Date()

    const qb = this.eventsRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.tags', 'tag')
      .leftJoinAndSelect('event.organization', 'organization')

    if (user_id) {
      qb.leftJoinAndSelect('event.tickets', 'ticket')
    } else {
      qb.leftJoinAndSelect('event.tickets', 'ticket', 'ticket.user_id IS NULL')
    }

    // Show only events that have not ended yet.
    qb.andWhere('event.datetime_end >= :now', { now })

    if (search) {
      qb.andWhere('(event.name ILIKE :search OR event.description ILIKE :search)', { search: `%${search}%` })
    }

    if (format === 'offline') {
      qb.andWhere('event.location IS NOT NULL')
    } else if (format === 'online') {
      qb.andWhere('event.location IS NULL')
    }

    if (tags?.length) {
      const uniqueTags = [...new Set(tags)]
      const subQb = this.eventsRepo
        .createQueryBuilder('filterEv')
        .select('filterEv.id')
        .innerJoin('filterEv.tags', 'filterTag')
        .where('filterTag.name IN (:...filterTags)', { filterTags: uniqueTags })
        .groupBy('filterEv.id')
        .having('COUNT(DISTINCT filterTag.id) = :filterTagsCount', { filterTagsCount: uniqueTags.length })

      qb.andWhere(`event.id IN (${subQb.getQuery()})`)
      qb.setParameters(subQb.getParameters())
    }

    if (date_from) {
      qb.andWhere('event.datetime_start >= :date_from', { date_from })
    }

    if (date_to) {
      qb.andWhere('event.datetime_end <= :date_to', { date_to })
    }

    if (location) {
      qb.andWhere('event.location ILIKE :location', { location: `%${location}%` })
    }

    if (location_from) {
      qb.andWhere('event.location_from ILIKE :location_from', { location_from: `%${location_from}%` })
    }

    if (location_to) {
      qb.andWhere('event.location_to ILIKE :location_to', { location_to: `%${location_to}%` })
    }

    if (organization_id) {
      qb.andWhere('event.organization_id = :organization_id', { organization_id })
    }

    if (user_id) {
      qb.andWhere('ticket.user_id = :user_id', { user_id })
    }

    // Sorting
    const order = sort_order === 'asc' ? 'ASC' : 'DESC'
    if (sort_by === 'name') {
      qb.orderBy('event.name', order)
    } else if (sort_by === 'attendees') {
      qb.orderBy('event.seats', order, 'NULLS LAST')
    } else {
      // default: by date (upcoming first when desc, oldest first when asc)
      qb.orderBy('event.datetime_start', sort_by ? order : 'ASC')
    }

    const total = await qb.getCount()
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany()
    const locale = this.contentLocalization.resolveRequestedLocale(acceptLanguage)
    const data = await Promise.all(
      items.map((event) =>
        this.contentLocalization
          .localizeEvent(event, locale, {
            includeOrganization: true,
            includeTickets: true,
            includeTags: true,
          })
          .then((localized) => this.sanitizeEvent(localized)),
      ),
    )

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    }
  }

  async findOne(id: string, acceptLanguage?: string) {
    const event = await this.findOneEntity(id)

    // Collect attendees from paid tickets with a linked user
    const attendeesFromTickets: Array<{ id: string; avatarUrl?: string; name: string; username: string | null }> = []
    const seenUserIds = new Set<string>()
    for (const ticket of event.tickets ?? []) {
      if (ticket.user_id && ticket.user && ticket.status === 'PAID') {
        if (!seenUserIds.has(ticket.user_id)) {
          seenUserIds.add(ticket.user_id)
          const u = ticket.user
          const firstName = u.first_name ?? ''
          const lastName = u.last_name ?? ''
          attendeesFromTickets.push({
            id: ticket.user_id,
            avatarUrl: u.avatar ?? undefined,
            name: [firstName, lastName].filter(Boolean).join(' ') || u.username || 'User',
            username: u.username || null,
          })
        }
      }
    }

    // Strip sold tickets from exposed ticket list; expose attendees only when public
    event.tickets = (event.tickets ?? []).filter((ticket) => !ticket.user_id)
    const locale = this.contentLocalization.resolveRequestedLocale(acceptLanguage)
    const localized = await this.contentLocalization.localizeEvent(event, locale, {
      includeOrganization: true,
      includeTickets: true,
      includeTags: true,
    })
    const sanitized: Record<string, unknown> = { ...(this.sanitizeEvent(localized) as object) }

    // Inject attendee count and conditionally the full attendees list
    sanitized.attendeeCount = seenUserIds.size
    if (event.attendees_public) {
      sanitized.attendees_public = true
      sanitized.attendees = attendeesFromTickets
    } else {
      sanitized.attendees_public = false
      sanitized.attendees = []
    }

    return sanitized
  }

  async update(id: string, dto: UpdateEventDto, user: JwtPayload) {
    const { tags: tags, ...rest } = dto
    const event = await this.findOneEntity(id)
    this.assertOrganizationOwnsEvent(user, event.organization_id)

    Object.assign(event, rest)

    if (tags?.length) event.tags = await this.tagsRepo.findBy({ id: In(tags) })

    return await this.eventsRepo.save(event)
  }

  async remove(id: string, user: JwtPayload) {
    const event = await this.findOneEntity(id)
    this.assertOrganizationOwnsEvent(user, event.organization_id)
    await this.eventsRepo.remove(event)
  }

  async addGalleryImages(id: string, imageUrls: string[], user: JwtPayload) {
    const event = await this.findOneEntity(id)
    this.assertOrganizationOwnsEvent(user, event.organization_id)
    const existing = event.gallery ?? []
    const newUrls = imageUrls.filter((u) => !existing.includes(u))
    event.gallery = [...existing, ...newUrls]
    return await this.eventsRepo.save(event)
  }

  private assertOrganizationOwnsEvent(user: JwtPayload, organizationId?: string | null) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organizations can manage events')
    }

    if (!organizationId || user.sub !== organizationId) {
      throw new ForbiddenException('You can manage only your organization events')
    }
  }

  private sanitizeEvent<T extends object>(event: T): T {
    const sanitized = { ...event } as Record<string, unknown>

    if (this.isRecord(sanitized.organization)) {
      sanitized.organization = this.sanitizeOrganizationLike(sanitized.organization)
    }

    if (Array.isArray(sanitized.tickets)) {
      sanitized.tickets = sanitized.tickets.map((ticket) => {
        if (!this.isRecord(ticket)) return ticket
        const normalizedTicket = { ...ticket }
        delete normalizedTicket.private_info
        delete normalizedTicket.private_files
        if (this.isRecord(normalizedTicket.user)) {
          normalizedTicket.user = this.sanitizeUserLike(normalizedTicket.user)
        }
        return normalizedTicket
      })
    }

    return sanitized as T
  }

  private sanitizeOrganizationLike(organization: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...organization }
    delete sanitized.password
    delete sanitized.two_fa_secret
    delete sanitized.sessions
    delete sanitized.otps
    return sanitized
  }

  private sanitizeUserLike(user: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...user }
    delete sanitized.password
    delete sanitized.two_fa_secret
    delete sanitized.google_refresh_token
    return sanitized
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }

  async subscribe(eventId: string, userId: string): Promise<{ message: string }> {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } })
    if (!event) throw new NotFoundException('Event not found')
    const existing = await this.eventSubRepo.findOne({ where: { event_id: eventId, user_id: userId } })
    if (!existing) {
      await this.eventSubRepo.save(this.eventSubRepo.create({ event_id: eventId, user_id: userId }))
    }
    return { message: 'Subscribed' }
  }

  async unsubscribe(eventId: string, userId: string): Promise<{ message: string }> {
    await this.eventSubRepo.delete({ event_id: eventId, user_id: userId })
    return { message: 'Unsubscribed' }
  }

  async getSubscription(eventId: string, userId: string): Promise<{ subscribed: boolean }> {
    const sub = await this.eventSubRepo.findOne({ where: { event_id: eventId, user_id: userId } })
    return { subscribed: !!sub }
  }

  // ── Comments ─────────────────────────────────────────────────────────────

  async getComments(eventId: string, page: number, limit: number) {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } })
    if (!event) throw new NotFoundException('Event not found')

    const [items, total] = await this.eventCommentRepo.findAndCount({
      where: { event_id: eventId },
      relations: ['user'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })

    const data = items.map((comment) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      event_id: comment.event_id,
      user_id: comment.user_id,
      user: comment.user
        ? {
            id: comment.user.id,
            username: comment.user.username,
            first_name: comment.user.first_name,
            last_name: comment.user.last_name,
            avatar: comment.user.avatar,
          }
        : null,
    }))

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    }
  }

  async createComment(eventId: string, userId: string, content: string) {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } })
    if (!event) throw new NotFoundException('Event not found')

    const comment = this.eventCommentRepo.create({ event_id: eventId, user_id: userId, content })
    const saved = await this.eventCommentRepo.save(comment)

    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'username', 'first_name', 'last_name', 'avatar'],
    })

    return {
      id: saved.id,
      content: saved.content,
      created_at: saved.created_at,
      event_id: saved.event_id,
      user_id: saved.user_id,
      user: user
        ? {
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            avatar: user.avatar,
          }
        : null,
    }
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.eventCommentRepo.findOne({ where: { id: commentId } })
    if (!comment) throw new NotFoundException('Comment not found')
    if (comment.user_id !== userId) throw new ForbiddenException('You can only delete your own comments')
    await this.eventCommentRepo.delete(commentId)
    return { message: 'Comment deleted' }
  }
}
