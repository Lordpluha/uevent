import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersAuthController } from './users-auth.controller'
import { OrgsAuthController } from './orgs-auth.controller'
import { GoogleAuthController } from './google-auth.controller'
import { UsersAuthService } from './users-auth.service'
import { OrgsAuthService } from './orgs-auth.service'
import { GoogleAuthService } from './google-auth.service'
import { JwtGuard } from './guards/jwt.guard'
import { User } from '../users/entities/user.entity'
import { UserSession } from '../users/entities/user-session.entity'
import { UserOtp } from '../users/entities/user-otp.entity'
import { Organization } from '../organizations/entities/organization.entity'
import { OrganizationSession } from '../organizations/entities/organization-session.entity'
import { Event } from '../events/entities/event.entity'
import { Ticket } from '../users/entities/ticket.entity'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'changeme',
      signOptions: { expiresIn: '15m' },
    }),
    TypeOrmModule.forFeature([User, UserSession, UserOtp, Organization, OrganizationSession, Event, Ticket]),
    NotificationsModule,
  ],
  controllers: [UsersAuthController, OrgsAuthController, GoogleAuthController],
  providers: [UsersAuthService, OrgsAuthService, GoogleAuthService, JwtGuard],
  exports: [JwtGuard, JwtModule],
})
export class AuthModule {}
