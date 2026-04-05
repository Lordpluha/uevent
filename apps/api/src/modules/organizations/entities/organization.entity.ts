import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm'
import { UuidEntity } from '../../../common/uuid.entity'
import { Event } from '../../events/entities/event.entity'
import { User } from '../../users/entities/user.entity'
import { OrganizationOtp } from './organization-otp.entity'
import { OrganizationSession } from './organization-session.entity'

@Entity('organizations')
export class Organization extends UuidEntity {
  @Column()
  @ApiProperty()
  name: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  slogan: string

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  description: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  avatar: string

  @Column({ name: 'cover_url', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  coverUrl: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  phone: string

  @Column({ unique: true })
  @ApiProperty({ format: 'email' })
  email: string

  @Column()
  @ApiHideProperty()
  password: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  category: string

  @Column({ default: false })
  @ApiProperty()
  verified: boolean

  @Column({ default: false })
  @ApiProperty()
  is_banned: boolean

  @Column({ default: true })
  @ApiProperty()
  notifications_enabled: boolean

  @Column({ default: false })
  @ApiProperty()
  push_notifications_enabled: boolean

  @Column({ default: false })
  @ApiProperty()
  two_factor_enabled: boolean

  @Column({ nullable: true, type: 'text' })
  @ApiHideProperty()
  two_fa_secret: string | null

  @Column('text', { array: true, nullable: true })
  @ApiPropertyOptional({ type: [String], nullable: true })
  tags: string[]

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  city: string

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ format: 'date-time' })
  created_at: Date

  // relations

  @OneToMany(
    () => OrganizationSession,
    (session) => session.organization,
  )
  @ApiHideProperty()
  sessions: OrganizationSession[]

  @OneToMany(
    () => OrganizationOtp,
    (otp) => otp.organization,
  )
  @ApiHideProperty()
  otps: OrganizationOtp[]

  @OneToMany(
    () => Event,
    (event) => event.organization,
  )
  @ApiHideProperty()
  events: Event[]

  @ManyToMany(
    () => User,
    (user) => user.followed_organizations,
  )
  @JoinTable({
    name: 'organization_followers',
    joinColumn: { name: 'organization_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  @ApiHideProperty()
  followers: User[]
}
