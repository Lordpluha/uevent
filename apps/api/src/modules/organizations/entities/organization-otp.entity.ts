import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Organization } from './organization.entity'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('organization_otps')
export class OrganizationOtp extends UuidEntity {

  @Column()
  code: string

  @Column()
  expires_at: Date

  // relations

  @Column()
  organization_id: string

  @ManyToOne(
    () => Organization,
    (org) => org.otps,
  )
  @JoinColumn({ name: 'organization_id' })
  organization: Organization
}
