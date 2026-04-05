import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Event } from '../events/entities/event.entity'
import { Notification } from '../notifications/entities/notification.entity'
import { NotificationsModule } from '../notifications/notifications.module'
import { Organization } from '../organizations/entities/organization.entity'
import { Ticket } from '../tickets/entities/ticket.entity'
import { User } from '../users/entities/user.entity'
import { OrganizationTransaction } from './entities/organization-transaction.entity'
import { OrganizationVerification } from './entities/organization-verification.entity'
import { OrganizationWithdrawalRequest } from './entities/organization-withdrawal-request.entity'
import { Payment } from './entities/payment.entity'
import { PromoCode } from './entities/promo-code.entity'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Ticket,
      Notification,
      User,
      OrganizationTransaction,
      OrganizationWithdrawalRequest,
      PromoCode,
      Event,
      OrganizationVerification,
      Organization,
    ]),
    NotificationsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
