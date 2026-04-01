import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OrganizationsService } from './organizations.service'
import { OrganizationsPrivateService } from './organizations-private.service'
import { OrganizationsController } from './organizations.controller'
import { Organization } from './entities/organization.entity'
import { OrganizationSession } from './entities/organization-session.entity'
import { OrganizationOtp } from './entities/organization-otp.entity'
import { Event } from '../events/entities/event.entity'
import { User } from '../users/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationSession, OrganizationOtp, Event, User])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationsPrivateService],
  exports: [OrganizationsService, OrganizationsPrivateService, TypeOrmModule],
})
export class OrganizationsModule {}
