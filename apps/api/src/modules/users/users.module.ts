import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { TicketsController } from './tickets.controller'
import { TicketsService } from './tickets.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { UserSession } from './entities/user-session.entity'
import { UserOtp } from './entities/user-otp.entity'
import { Ticket } from './entities/ticket.entity'
import { File } from '../files/entities/file.entity'
import { Event } from '../events/entities/event.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSession, UserOtp, Ticket, File, Event])],
  controllers: [UsersController, TicketsController],
  providers: [UsersService, TicketsService],
  exports: [UsersService, TicketsService, TypeOrmModule],
})
export class UsersModule {}
