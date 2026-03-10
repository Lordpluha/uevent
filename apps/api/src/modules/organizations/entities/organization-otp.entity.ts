import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Organization } from './organization.entity'

@Entity('organization_otps')
export class OrganizationOtp {
  @PrimaryGeneratedColumn('uuid')
  id: string

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
