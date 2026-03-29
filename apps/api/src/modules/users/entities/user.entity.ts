import { Entity, Column, OneToMany, CreateDateColumn, ManyToMany } from 'typeorm'
import { Ticket } from './ticket.entity'
import { UserSession } from './user-session.entity'
import { UserOtp } from './user-otp.entity'
import { Notification } from '../../notifications/entities/notification.entity'
import { Organization } from '../../organizations/entities/organization.entity'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('users')
export class User extends UuidEntity {

  @Column({ unique: true })
  username: string

  @Column({ unique: true })
  email: string

  @Column()
  password: string

  @Column({ nullable: true })
  first_name: string

  @Column({ nullable: true })
  last_name: string

  @Column({ unique: true, nullable: true })
  phone: string

  @Column({ nullable: true })
  location: string

  @Column({ nullable: true })
  avatar: string

  @Column({ type: 'text', nullable: true })
  bio: string

  @Column({ nullable: true })
  website: string

  @Column({ nullable: true })
  timezone: string

  @Column({ type: 'simple-array', nullable: true })
  interests: string[]

  @Column({ default: true })
  notifications_enabled: boolean

  @Column({ default: false })
  push_notifications_enabled: boolean

  @Column({ default: true })
  payment_email_enabled: boolean

  @Column({ default: true })
  subscription_notifications_enabled: boolean

  @Column({ default: true })
  login_notifications_enabled: boolean

  @Column({ default: false })
  is_banned: boolean

  @Column({ default: false })
  two_fa: boolean

  @Column({ type: 'text', nullable: true })
  two_fa_secret: string | null

  @Column({ type: 'text', nullable: true })
  google_id: string | null

  @Column({ type: 'text', nullable: true })
  google_refresh_token: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

  // relations

  @OneToMany(
    () => Ticket,
    (ticket) => ticket.user,
  )
  tickets: Ticket[]

  @OneToMany(
    () => UserSession,
    (session) => session.user,
  )
  sessions: UserSession[]

  @OneToMany(
    () => UserOtp,
    (otp) => otp.user,
  )
  otps: UserOtp[]

  @OneToMany(
    () => Notification,
    (notification) => notification.user,
  )
  notifications: Notification[]

  @ManyToMany(
    () => Organization,
    (organization) => organization.followers,
  )
  followed_organizations: Organization[]
}
