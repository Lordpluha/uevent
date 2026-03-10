import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OrganizationsService } from './organizations.service'
import { OrganizationsController } from './organizations.controller'
import { Organization } from './entities/organization.entity'
import { OrganizationSession } from './entities/organization-session.entity'
import { OrganizationOtp } from './entities/organization-otp.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationSession, OrganizationOtp])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
