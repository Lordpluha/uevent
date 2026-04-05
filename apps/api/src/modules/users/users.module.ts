import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Event } from '../events/entities/event.entity'
import { File } from '../files/entities/file.entity'
import { TicketsModule } from '../tickets/tickets.module'
import { User } from './entities/user.entity'
import { UserOtp } from './entities/user-otp.entity'
import { UserSession } from './entities/user-session.entity'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { UsersPrivateService } from './users-private.service'

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSession, UserOtp, File, Event]), TicketsModule],
  controllers: [UsersController],
  providers: [UsersService, UsersPrivateService],
  exports: [UsersService, UsersPrivateService, TypeOrmModule],
})
export class UsersModule {}
