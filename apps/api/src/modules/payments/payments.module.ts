import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PaymentsService } from './payments.service'
import { PaymentsController } from './payments.controller'
import { Payment } from './entities/payment.entity'
import { NotificationsModule } from '../notifications/notifications.module'
import { Ticket } from '../users/entities/ticket.entity'
import { Notification } from '../notifications/entities/notification.entity'
import { User } from '../users/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Ticket, Notification, User]), NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
