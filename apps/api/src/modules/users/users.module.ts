import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersPrivateService } from './users-private.service'
import { UsersController } from './users.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { UserSession } from './entities/user-session.entity'
import { UserOtp } from './entities/user-otp.entity'
import { File } from '../files/entities/file.entity'
import { Event } from '../events/entities/event.entity'
import { TicketsModule } from '../tickets/tickets.module'

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSession, UserOtp, File, Event]), TicketsModule],
  controllers: [UsersController],
  providers: [UsersService, UsersPrivateService],
  exports: [UsersService, UsersPrivateService, TypeOrmModule],
})
export class UsersModule {}

