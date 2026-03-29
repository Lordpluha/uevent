import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Ticket, TicketStatus } from './entities/ticket.entity'
import { CreateTicketDto } from './dto/create-ticket.dto'
import { UpdateTicketDto } from './dto/update-ticket.dto'
import { GetTicketsParams } from './params/get-tickets.params'
import { Event } from '../events/entities/event.entity'
import { JwtPayload } from '../auth/types/jwt-payload.interface'

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,

    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
  ) {}

  async create(dto: CreateTicketDto, user: JwtPayload) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organizations can create tickets')
    }

    const event = await this.eventsRepo.findOneBy({ id: dto.event_id })
    if (!event) throw new NotFoundException(`Event with id #${dto.event_id} not found`)
    if (event.organization_id !== user.sub) {
      throw new ForbiddenException('You can create tickets only for your organization events')
    }

    if (dto.datetime_end <= dto.datetime_start) {
      throw new BadRequestException('Ticket end datetime must be later than start datetime')
    }

    const quantityLimited = dto.quantity_limited ?? false
    if (quantityLimited && !dto.quantity_total) {
      throw new BadRequestException('quantity_total is required when quantity_limited is enabled')
    }

    const ticket = this.ticketsRepo.create({
      ...dto,
      quantity_limited: quantityLimited,
      quantity_total: quantityLimited ? (dto.quantity_total ?? null) : null,
      quantity_sold: 0,
      status: dto.status ?? TicketStatus.READY,
      user_id: null,
    })

    return await this.ticketsRepo.save(ticket)
  }

  async findAll(query: GetTicketsParams) {
    const { page, limit, event_id, user_id, status } = query

    const qb = this.ticketsRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.event', 'event')
      .leftJoinAndSelect('ticket.user', 'user')
      .orderBy('ticket.created_at', 'DESC')

    if (event_id) qb.andWhere('ticket.event_id = :event_id', { event_id })
    if (user_id) qb.andWhere('ticket.user_id = :user_id', { user_id })
    if (status) qb.andWhere('ticket.status = :status', { status })

    const total = await qb.getCount()
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany()

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

  async findOne(id: string) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      relations: ['event', 'user', 'private_files'],
    })

    if (!ticket) throw new NotFoundException(`Ticket with id #${id} not found`)
    return ticket
  }

  async update(id: string, dto: UpdateTicketDto) {
    const ticket = await this.findOne(id)
    Object.assign(ticket, dto)
    return await this.ticketsRepo.save(ticket)
  }

  async remove(id: string) {
    const ticket = await this.findOne(id)
    await this.ticketsRepo.remove(ticket)
  }
}
