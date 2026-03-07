import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Event } from './entities/event.entity';
import { Tag } from '../tags/entities/tag.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,

    @InjectRepository(Tag)
    private readonly tagsRepo: Repository<Tag>,
  ) {}

  async create(dto: CreateEventDto): Promise<Event> {
    const { tags: tags, ...rest } = dto;

    const event = this.eventsRepo.create(rest);

    if(tags?.length) event.tags = await this.tagsRepo.findBy({ id: In(tags) });

    return await this.eventsRepo.save(event);
  }

  async findAll(): Promise<Event[]> {
    return await this.eventsRepo.find({ relations: ['tags', 'tickets'] });
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventsRepo.findOne({
      where: { id },
      relations: ['tags', 'tickets', 'recurrence', 'recurrence.overrides'],
    });

    if(!event) throw new NotFoundException(`Event with id #${id} not found`);
    return event;
  }

  async update(id: number, dto: UpdateEventDto): Promise<Event> {
    const { tags: tags, ...rest } = dto;
    const event = await this.findOne(id);

    Object.assign(event, rest);

    if(tags?.length) event.tags = await this.tagsRepo.findBy({ id: In(tags) });

    return await this.eventsRepo.save(event);
  }

  async remove(id: number): Promise<void> {
    const event = await this.findOne(id);
    await this.eventsRepo.remove(event);
  }
}
