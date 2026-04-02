import { Entity, Column, OneToMany, CreateDateColumn, ManyToMany } from 'typeorm'
import { Ticket } from '../../tickets/entities/ticket.entity'
import { UserSession } from './user-session.entity'
import { UserOtp } from './user-otp.entity'
import { Notification } from '../../notifications/entities/notification.entity'
import { Organization } from '../../organizations/entities/organization.entity'
import { UuidEntity } from '../../../common/uuid.entity'
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

@Entity('users')
export class User extends UuidEntity {

  @Column({ unique: true })
  @ApiProperty()
  username: string

  @Column({ unique: true })
  @ApiProperty({ format: 'email' })
  email: string

  @Column()
  @ApiHideProperty()
  password: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  first_name: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  last_name: string

  @Column({ unique: true, nullable: true })
  @ApiPropertyOptional({ nullable: true })
  phone: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  location: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  avatar: string

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  bio: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  website: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  timezone: string

  @Column({ type: 'simple-array', nullable: true })
  @ApiPropertyOptional({ type: [String], nullable: true })
  interests: string[]

  @Column({ default: true })
  @ApiProperty()
  notifications_enabled: boolean

  @Column({ default: false })
  @ApiProperty()
  push_notifications_enabled: boolean

  @Column({ default: true })
  @ApiProperty()
  payment_email_enabled: boolean

  @Column({ default: true })
  @ApiProperty()
  subscription_notifications_enabled: boolean

  @Column({ default: true })
  @ApiProperty()
  login_notifications_enabled: boolean

  @Column({ default: false })
  @ApiProperty()
  is_banned: boolean

  @Column({ default: false })
  @ApiProperty()
  two_fa: boolean

  @Column({ type: 'text', nullable: true })
  @ApiHideProperty()
  two_fa_secret: string | null

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  google_id: string | null

  @Column({ type: 'text', nullable: true })
  @ApiHideProperty()
  google_refresh_token: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ format: 'date-time' })
  created_at: Date

  // relations

  @OneToMany(
    () => Ticket,
    (ticket) => ticket.user,
  )
  @ApiHideProperty()
  tickets: Ticket[]

  @OneToMany(
    () => UserSession,
    (session) => session.user,
  )
  @ApiHideProperty()
  sessions: UserSession[]

  @OneToMany(
    () => UserOtp,
    (otp) => otp.user,
  )
  @ApiHideProperty()
  otps: UserOtp[]

  @OneToMany(
    () => Notification,
    (notification) => notification.user,
  )
  @ApiHideProperty()
  notifications: Notification[]

  @ManyToMany(
    () => Organization,
    (organization) => organization.followers,
  )
  @ApiHideProperty()
  followed_organizations: Organization[]
}
