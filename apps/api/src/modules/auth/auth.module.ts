import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApiConfigService } from '../../config/api-config.service'
import { Event } from '../events/entities/event.entity'
import { NotificationsModule } from '../notifications/notifications.module'
import { Organization } from '../organizations/entities/organization.entity'
import { OrganizationSession } from '../organizations/entities/organization-session.entity'
import { Ticket } from '../tickets/entities/ticket.entity'
import { User } from '../users/entities/user.entity'
import { UserOtp } from '../users/entities/user-otp.entity'
import { UserSession } from '../users/entities/user-session.entity'
import { GoogleAuthController } from './google-auth.controller'
import { GoogleAuthService } from './google-auth.service'
import { JwtGuard } from './guards/jwt.guard'
import { OptionalJwtGuard } from './guards/optional-jwt.guard'
import { OrgsAuthController } from './orgs-auth.controller'
import { OrgsAuthService } from './orgs-auth.service'
import { UsersAuthController } from './users-auth.controller'
import { UsersAuthService } from './users-auth.service'

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ApiConfigService],
      useFactory: (apiConfig: ApiConfigService) => ({
        secret: apiConfig.jwtSecret,
        signOptions: { expiresIn: '15m' },
      }),
    }),
    TypeOrmModule.forFeature([User, UserSession, UserOtp, Organization, OrganizationSession, Event, Ticket]),
    NotificationsModule,
  ],
  controllers: [UsersAuthController, OrgsAuthController, GoogleAuthController],
  providers: [UsersAuthService, OrgsAuthService, GoogleAuthService, JwtGuard, OptionalJwtGuard],
  exports: [JwtGuard, OptionalJwtGuard, JwtModule],
})
export class AuthModule {}
