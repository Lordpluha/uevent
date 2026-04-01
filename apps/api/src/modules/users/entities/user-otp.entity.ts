import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './user.entity'
import { UuidEntity } from '../../../common/uuid.entity'
import { ApiProperty } from '@nestjs/swagger'

@Entity('user_otps')
export class UserOtp extends UuidEntity {

  @Column()
  @ApiProperty()
  code: string

  @Column({ default: 'password_reset' })
  @ApiProperty()
  type: string

  @Column()
  @ApiProperty({ format: 'date-time' })
  expires_at: Date

  @Column({ default: false })
  @ApiProperty()
  used: boolean

  // relations

  @Column()
  @ApiProperty({ format: 'uuid' })
  user_id: string

  @ManyToOne(
    () => User,
    (user) => user.otps,
  )
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({ type: () => User })
  user: User
}
