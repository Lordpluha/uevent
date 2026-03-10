import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './user.entity'

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  access: string

  @Column()
  refresh: string

  @Column()
  expiration: Date

  @Column({ nullable: true })
  location: string

  @Column({ nullable: true })
  device_type: string

  @Column({ nullable: true })
  ip_address: string

  // relations

  @Column()
  user_id: number

  @ManyToOne(
    () => User,
    (user) => user.sessions,
  )
  @JoinColumn({ name: 'user_id' })
  user: User
}
