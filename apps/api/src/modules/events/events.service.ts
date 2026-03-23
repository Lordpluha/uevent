import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Event } from './entities/event.entity'
import { Tag } from '../tags/entities/tag.entity'
import { CreateEventDto } from './dto/create-event.dto'
import { UpdateEventDto } from './dto/update-event.dto'
import { GetEventsParams } from './params/get-events.params'

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,

    @InjectRepository(Tag)
    private readonly tagsRepo: Repository<Tag>,
  ) {}

  async create({ tags, ...rest }: CreateEventDto) {
    const event = this.eventsRepo.create(rest)

    if (tags?.length) event.tags = await this.tagsRepo.findBy({ id: In(tags) })

    return await this.eventsRepo.save(event)
  }

  async findAll(query: GetEventsParams) {
    const { page, limit, search, format, tags, date_from, date_to, location, organization_id } = query

    const qb = this.eventsRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.tags', 'tag')
      .leftJoinAndSelect('event.tickets', 'ticket')
      .leftJoinAndSelect('event.organization', 'organization')

    if (search) {
      qb.andWhere('(event.name ILIKE :search OR event.description ILIKE :search)', { search: `%${search}%` })
    }

    if (format === 'offline') {
      qb.andWhere('event.location IS NOT NULL')
    } else if (format === 'online') {
      qb.andWhere('event.location IS NULL')
    }

    if (tags?.length) {
      const subQb = this.eventsRepo
        .createQueryBuilder('filterEv')
        .select('filterEv.id')
        .innerJoin('filterEv.tags', 'filterTag')
        .where('filterTag.name IN (:...filterTags)', { filterTags: tags })

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

    if (organization_id) {
      qb.andWhere('event.organization_id = :organization_id', { organization_id })
    }

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
    const event = await this.eventsRepo.findOne({
      where: { id },
      relations: ['tags', 'tickets', 'organization', 'recurrence', 'recurrence.overrides'],
    })

    if (!event) throw new NotFoundException(`Event with id #${id} not found`)
    return event
  }

  async update(id: string, dto: UpdateEventDto) {
    const { tags: tags, ...rest } = dto
    const event = await this.findOne(id)

    Object.assign(event, rest)

    if (tags?.length) event.tags = await this.tagsRepo.findBy({ id: In(tags) })

    return await this.eventsRepo.save(event)
  }

  async remove(id: string) {
    const event = await this.findOne(id)
    await this.eventsRepo.remove(event)
  }
}
