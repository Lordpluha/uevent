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
    const { page, limit, tags, date_from, date_to, location } = query

    const qb = this.eventsRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.tags', 'tag')
      .leftJoinAndSelect('event.tickets', 'ticket')

    if (tags?.length) {
      qb.andWhere((sub) => {
        const sq = sub
          .subQuery()
          .select('et.event_id')
          .from('event_tags', 'et')
          .where('et.tag_id IN (:...tags)', { tags })
          .getQuery()
        return 'event.id IN ' + sq
      })
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
      relations: ['tags', 'tickets', 'recurrence', 'recurrence.overrides'],
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
