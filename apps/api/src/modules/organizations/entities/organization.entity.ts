import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { OrganizationSession } from './organization-session.entity'
import { OrganizationOtp } from './organization-otp.entity'
import { Event } from '../../events/entities/event.entity'

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ nullable: true })
  slogan: string

  @Column({ type: 'text', nullable: true })
  description: string


  @Column({ nullable: true })
  avatar: string

  @Column({ nullable: true })
  phone: string

  @Column({ unique: true })
  email: string

  @Column()
  password: string


  @Column({ nullable: true })
  category: string

  @Column({ default: false })
  verified: boolean

  @Column('text', { array: true, nullable: true })
  tags: string[]

  @Column({ nullable: true })
  city: string

  // relations

  @OneToMany(
    () => OrganizationSession,
    (session) => session.organization,
  )
  sessions: OrganizationSession[]

  @OneToMany(
    () => OrganizationOtp,
    (otp) => otp.organization,
  )
  otps: OrganizationOtp[]

  @OneToMany(
    () => Event,
    (event) => event.organization,
  )
  events: Event[]
}
