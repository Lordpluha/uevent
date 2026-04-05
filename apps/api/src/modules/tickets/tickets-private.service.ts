import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtPayload } from '../auth/types/jwt-payload.interface'
import { Event } from '../events/entities/event.entity'
import { CreateTicketDto } from './dto/create-ticket.dto'
import { UpdateTicketDto } from './dto/update-ticket.dto'
import { Ticket, TicketStatus } from './entities/ticket.entity'

@Injectable()
export class TicketsPrivateService {
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

  async findOneEntity(id: string, relations: string[] = ['event', 'user', 'private_files']) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      relations,
    })

    if (!ticket) throw new NotFoundException(`Ticket with id #${id} not found`)
    return ticket
  }

  private async assertOrganizationOwnsTicket(id: string, user: JwtPayload) {
    if (user.type !== 'organization') {
      throw new ForbiddenException('Only organizations can manage tickets')
    }

    const ticket = await this.findOneEntity(id, ['event'])
    if (!ticket.event || ticket.event.organization_id !== user.sub) {
      throw new ForbiddenException('You can manage tickets only for your organization events')
    }

    return ticket
  }

  async update(id: string, dto: UpdateTicketDto, user: JwtPayload) {
    const ticket = await this.assertOrganizationOwnsTicket(id, user)
    Object.assign(ticket, dto)
    return await this.ticketsRepo.save(ticket)
  }

  async remove(id: string, user: JwtPayload) {
    const ticket = await this.assertOrganizationOwnsTicket(id, user)
    await this.ticketsRepo.remove(ticket)
  }
}
