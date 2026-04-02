import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventsService } from './events.service'
import { EventsController } from './events.controller'
import { Event } from './entities/event.entity'
import { EventSubscription } from './entities/event-subscription.entity'
import { Recurrence } from './entities/recurrence.entity'
import { Override } from './entities/override.entity'
import { Tag } from '../tags/entities/tag.entity'
import { Ticket } from '../tickets/entities/ticket.entity'
import { Organization } from '../organizations/entities/organization.entity'
import { Notification } from '../notifications/entities/notification.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventSubscription, Recurrence, Override, Tag, Ticket, Organization, Notification])],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService, TypeOrmModule],
})
export class EventsModule {}
