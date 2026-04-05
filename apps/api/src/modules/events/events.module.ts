import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Notification } from '../notifications/entities/notification.entity'
import { NotificationsModule } from '../notifications/notifications.module'
import { Organization } from '../organizations/entities/organization.entity'
import { Tag } from '../tags/entities/tag.entity'
import { Ticket } from '../tickets/entities/ticket.entity'
import { User } from '../users/entities/user.entity'
import { Event } from './entities/event.entity'
import { EventComment } from './entities/event-comment.entity'
import { EventSubscription } from './entities/event-subscription.entity'
import { Override } from './entities/override.entity'
import { Recurrence } from './entities/recurrence.entity'
import { EventsController } from './events.controller'
import { EventsService } from './events.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventSubscription,
      EventComment,
      Recurrence,
      Override,
      Tag,
      Ticket,
      Organization,
      Notification,
      User,
    ]),
    NotificationsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService, TypeOrmModule],
})
export class EventsModule {}
