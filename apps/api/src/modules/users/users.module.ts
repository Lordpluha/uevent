import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { UserSession } from './entities/user-session.entity'
import { UserOtp } from './entities/user-otp.entity'
import { Ticket } from './entities/ticket.entity'
import { File } from '../files/entities/file.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSession, UserOtp, Ticket, File])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
