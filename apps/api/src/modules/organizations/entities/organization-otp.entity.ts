import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Organization } from './organization.entity'
import { UuidEntity } from '../../../common/uuid.entity'
import { ApiProperty } from '@nestjs/swagger'

@Entity('organization_otps')
export class OrganizationOtp extends UuidEntity {

  @Column()
  @ApiProperty()
  code: string

  @Column()
  @ApiProperty({ format: 'date-time' })
  expires_at: Date

  // relations

  @Column()
  @ApiProperty({ format: 'uuid' })
  organization_id: string

  @ManyToOne(
    () => Organization,
    (org) => org.otps,
  )
  @JoinColumn({ name: 'organization_id' })
  @ApiProperty({ type: () => Organization })
  organization: Organization
}
