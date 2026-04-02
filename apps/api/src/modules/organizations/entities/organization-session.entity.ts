import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Organization } from './organization.entity'
import { UuidEntity } from '../../../common/uuid.entity'
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

@Entity('organization_sessions')
export class OrganizationSession extends UuidEntity {

  @Column()
  @ApiHideProperty()
  access: string

  @Column()
  @ApiHideProperty()
  refresh: string

  @Column()
  @ApiHideProperty()
  expiration: Date

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  location: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  device_type: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  ip_address: string

  @Column({ default: false })
  @ApiProperty()
  two_fa: boolean

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  user_agent: string

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ format: 'date-time' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ format: 'date-time' })
  last_active_at: Date

  // relations

  @Column()
  @ApiHideProperty()
  organization_id: string

  @ManyToOne(
    () => Organization,
    (org) => org.sessions,
  )
  @JoinColumn({ name: 'organization_id' })
  @ApiHideProperty()
  organization: Organization
}
