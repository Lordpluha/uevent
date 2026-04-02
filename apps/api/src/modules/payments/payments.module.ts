import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PaymentsService } from './payments.service'
import { PaymentsController } from './payments.controller'
import { Payment } from './entities/payment.entity'
import { NotificationsModule } from '../notifications/notifications.module'
import { Ticket } from '../users/entities/ticket.entity'
import { Notification } from '../notifications/entities/notification.entity'
import { User } from '../users/entities/user.entity'
import { OrganizationTransaction } from './entities/organization-transaction.entity'
import { OrganizationWithdrawalRequest } from './entities/organization-withdrawal-request.entity'
import { PromoCode } from './entities/promo-code.entity'
import { Event } from '../events/entities/event.entity'
import { OrganizationVerification } from './entities/organization-verification.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Ticket, Notification, User, OrganizationTransaction, OrganizationWithdrawalRequest, PromoCode, Event, OrganizationVerification]), NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
