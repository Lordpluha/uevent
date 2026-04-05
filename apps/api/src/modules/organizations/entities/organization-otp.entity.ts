import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { UuidEntity } from '../../../common/uuid.entity'
import { Organization } from './organization.entity'

@Entity('organization_otps')
export class OrganizationOtp extends UuidEntity {
  @Column()
  @ApiProperty()
  code: string

  @Column({ default: 'password_reset' })
  @ApiProperty()
  type: string

  @Column()
  @ApiProperty({ format: 'date-time' })
  expires_at: Date

  @Column({ default: false })
  @ApiProperty()
  used: boolean

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
