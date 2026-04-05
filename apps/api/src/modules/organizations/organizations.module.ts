import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Event } from '../events/entities/event.entity'
import { User } from '../users/entities/user.entity'
import { Organization } from './entities/organization.entity'
import { OrganizationOtp } from './entities/organization-otp.entity'
import { OrganizationSession } from './entities/organization-session.entity'
import { OrganizationsController } from './organizations.controller'
import { OrganizationsService } from './organizations.service'
import { OrganizationsPrivateService } from './organizations-private.service'

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationSession, OrganizationOtp, Event, User])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationsPrivateService],
  exports: [OrganizationsService, OrganizationsPrivateService, TypeOrmModule],
})
export class OrganizationsModule {}
