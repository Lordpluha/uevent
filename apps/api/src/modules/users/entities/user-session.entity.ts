import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { User } from './user.entity'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('user_sessions')
export class UserSession extends UuidEntity {

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

  @Column({ nullable: true })
  user_agent: string

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  last_active_at: Date

  // relations

  @Column()
  user_id: string

  @ManyToOne(
    () => User,
    (user) => user.sessions,
  )
  @JoinColumn({ name: 'user_id' })
  user: User
}
