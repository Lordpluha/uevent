import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './user.entity'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('user_otps')
export class UserOtp extends UuidEntity {

  @Column()
  code: string

  @Column({ default: 'password_reset' })
  type: string

  @Column()
  expires_at: Date

  @Column({ default: false })
  used: boolean

  // relations

  @Column()
  user_id: string

  @ManyToOne(
    () => User,
    (user) => user.otps,
  )
  @JoinColumn({ name: 'user_id' })
  user: User
}
