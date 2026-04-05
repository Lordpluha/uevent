import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsSelect, Repository } from 'typeorm'
import { ContentLocalizationService } from '../../common/localization/content-localization.service'
import { JwtPayload } from '../auth/types/jwt-payload.interface'
import { CreateTicketDto } from './dto/create-ticket.dto'
import { UpdateTicketDto } from './dto/update-ticket.dto'
import { Ticket } from './entities/ticket.entity'
import { GetTicketsParams } from './params/get-tickets.params'
import { TicketsPrivateService } from './tickets-private.service'

const PUBLIC_EVENT_SELECT = {
  id: true,
  name: true,
  description: true,
  gallery: true,
  time_zone: true,
  datetime_start: true,
  datetime_end: true,
  location: true,
  location_map_url: true,
  online_link: true,
  organization_id: true,
} as const

const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  first_name: true,
  last_name: true,
  avatar: true,
} as const

const PUBLIC_TICKET_SELECT: FindOptionsSelect<Ticket> = {
  id: true,
  image: true,
  name: true,
  status: true,
  description: true,
  datetime_start: true,
  datetime_end: true,
  price: true,
  quantity_limited: true,
  quantity_total: true,
  quantity_sold: true,
  created_at: true,
  user_id: true,
  event_id: true,
  event: PUBLIC_EVENT_SELECT,
  user: PUBLIC_USER_SELECT,
}

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,

    private readonly contentLocalization: ContentLocalizationService,
    private readonly ticketsPrivateService: TicketsPrivateService,
  ) {}

  async create(dto: CreateTicketDto, user: JwtPayload) {
    const ticket = await this.ticketsPrivateService.create(dto, user)
    return this.findOne(ticket.id)
  }

  async findAll(query: GetTicketsParams, acceptLanguage?: string) {
    const { page, limit, event_id, user_id, status } = query

    const qb = this.ticketsRepo
      .createQueryBuilder('ticket')
      .select([
        'ticket.id',
        'ticket.image',
        'ticket.name',
        'ticket.status',
        'ticket.description',
        'ticket.datetime_start',
        'ticket.datetime_end',
        'ticket.price',
        'ticket.quantity_limited',
        'ticket.quantity_total',
        'ticket.quantity_sold',
        'ticket.created_at',
        'ticket.user_id',
        'ticket.event_id',
      ])
      .leftJoinAndSelect('ticket.event', 'event')
      .leftJoinAndSelect('ticket.user', 'user')
      .addSelect([
        'event.id',
        'event.name',
        'event.description',
        'event.gallery',
        'event.time_zone',
        'event.datetime_start',
        'event.datetime_end',
        'event.location',
        'event.location_map_url',
        'event.online_link',
        'event.organization_id',
      ])
      .addSelect(['user.id', 'user.username', 'user.first_name', 'user.last_name', 'user.avatar'])
      .orderBy('ticket.created_at', 'DESC')

    if (event_id) qb.andWhere('ticket.event_id = :event_id', { event_id })
    if (user_id) {
      qb.andWhere('ticket.user_id = :user_id', { user_id })
    } else {
      qb.andWhere('ticket.user_id IS NULL')
    }
    if (status) qb.andWhere('ticket.status = :status', { status })

    const total = await qb.getCount()
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany()
    const locale = this.contentLocalization.resolveRequestedLocale(acceptLanguage)
    const data = await Promise.all(
      items.map((ticket) => this.contentLocalization.localizeTicket(ticket, locale, { includeEvent: true })),
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
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      relations: ['event', 'user'],
      select: PUBLIC_TICKET_SELECT,
    })
    if (!ticket) throw new NotFoundException(`Ticket with id #${id} not found`)

    const locale = this.contentLocalization.resolveRequestedLocale(acceptLanguage)
    return await this.contentLocalization.localizeTicket(ticket, locale, { includeEvent: true })
  }

  async update(id: string, dto: UpdateTicketDto, user: JwtPayload) {
    await this.ticketsPrivateService.update(id, dto, user)
    return this.findOne(id)
  }

  async remove(id: string, user: JwtPayload) {
    await this.ticketsPrivateService.remove(id, user)
  }
}
