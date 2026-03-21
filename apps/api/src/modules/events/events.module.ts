import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventsService } from './events.service'
import { EventsController } from './events.controller'
import { Event } from './entities/event.entity'
import { Recurrence } from './entities/recurrence.entity'
import { Override } from './entities/override.entity'
import { Tag } from '../tags/entities/tag.entity'
import { Ticket } from '../users/entities/ticket.entity'
import { Organization } from '../organizations/entities/organization.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Event, Recurrence, Override, Tag, Ticket, Organization])],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService, TypeOrmModule],
})
export class EventsModule {}
