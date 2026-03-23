import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PaymentsService } from './payments.service'
import { PaymentsController } from './payments.controller'
import { Payment } from './entities/payment.entity'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
