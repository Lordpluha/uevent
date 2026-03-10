import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { OrganizationSession } from './organization-session.entity'
import { OrganizationOtp } from './organization-otp.entity'

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
}
