import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { Ticket } from './ticket.entity'
import { UserSession } from './user-session.entity'
import { UserOtp } from './user-otp.entity'
import { Notification } from '../../notifications/entities/notification.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

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

  @Column({ default: false })
  is_banned: boolean

  @Column({ default: false })
  two_fa: boolean

  @Column({ nullable: true })
  google_id: string

  @Column({ nullable: true })
  google_refresh_token: string

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
}
