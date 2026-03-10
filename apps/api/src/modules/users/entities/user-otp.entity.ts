import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './user.entity'

@Entity('user_otps')
export class UserOtp {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  code: string

  @Column()
  expires_at: Date

  // relations

  @Column()
  used_id: number

  @ManyToOne(
    () => User,
    (user) => user.otps,
  )
  @JoinColumn({ name: 'used_id' })
  user: User
}
