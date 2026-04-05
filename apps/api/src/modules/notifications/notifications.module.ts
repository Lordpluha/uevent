import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Organization } from '../organizations/entities/organization.entity'
import { User } from '../users/entities/user.entity'
import { EmailService } from './email.service'
import { Notification } from './entities'
import { PushSubscription } from './entities/push-subscription.entity'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { PushNotificationService } from './push-notification.service'

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, PushSubscription, Organization])],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, PushNotificationService],
  exports: [NotificationsService, EmailService, PushNotificationService, TypeOrmModule],
})
export class NotificationsModule {}
