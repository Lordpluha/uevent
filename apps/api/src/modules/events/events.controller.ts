import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common'
import { EventsService } from './events.service'
import { CreateEventDto, CreateEventDtoSchema, UpdateEventDto, UpdateEventDtoSchema } from './dto'
import { GetEventsParams, GetEventsParamsSchema } from './params'
import { ZodValidationPipe } from 'nestjs-zod'

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateEventDtoSchema)) dto: CreateEventDto) {
    return this.eventsService.create(dto)
  }

  @Get()
  findAll(@Query(new ZodValidationPipe(GetEventsParamsSchema)) query: GetEventsParams) {
    return this.eventsService.findAll(query)
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateEventDtoSchema)) dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.remove(id)
  }
}
