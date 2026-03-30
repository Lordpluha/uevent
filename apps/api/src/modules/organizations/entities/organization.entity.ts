import { Entity, Column, OneToMany, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm'
import { OrganizationSession } from './organization-session.entity'
import { OrganizationOtp } from './organization-otp.entity'
import { Event } from '../../events/entities/event.entity'
import { User } from '../../users/entities/user.entity'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('organizations')
export class Organization extends UuidEntity {

  @Column()
  name: string

  @Column({ nullable: true })
  slogan: string

  @Column({ type: 'text', nullable: true })
  description: string


  @Column({ nullable: true })
  avatar: string

  @Column({ name: 'cover_url', nullable: true })
  coverUrl: string

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

  @Column({ default: false })
  two_factor_enabled: boolean

  @Column({ nullable: true, type: 'text' })
  two_fa_secret: string | null

  @Column('text', { array: true, nullable: true })
  tags: string[]

  @Column({ nullable: true })
  city: string

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

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

  @ManyToMany(
    () => User,
    (user) => user.followed_organizations,
  )
  @JoinTable({
    name: 'organization_followers',
    joinColumn: { name: 'organization_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  followers: User[]
}
