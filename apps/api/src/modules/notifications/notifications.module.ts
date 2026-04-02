import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { EmailService } from './email.service'
import { PushNotificationService } from './push-notification.service'
import { Notification } from './entities'
import { PushSubscription } from './entities/push-subscription.entity'
import { User } from '../users/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, PushSubscription])],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, PushNotificationService],
  exports: [NotificationsService, EmailService, PushNotificationService, TypeOrmModule],
})
export class NotificationsModule {}
