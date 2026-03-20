import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthController } from './auth.controller'
import { UsersAuthService } from './users-auth.service'
import { OrgsAuthService } from './orgs-auth.service'
import { JwtGuard } from './guards/jwt.guard'
import { User } from '../users/entities/user.entity'
import { UserSession } from '../users/entities/user-session.entity'
import { Organization } from '../organizations/entities/organization.entity'
import { OrganizationSession } from '../organizations/entities/organization-session.entity'

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'changeme',
      signOptions: { expiresIn: '15m' },
    }),
    TypeOrmModule.forFeature([User, UserSession, Organization, OrganizationSession]),
  ],
  controllers: [AuthController],
  providers: [UsersAuthService, OrgsAuthService, JwtGuard],
  exports: [JwtGuard, JwtModule],
})
export class AuthModule {}
