import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { User } from './user.entity'
import { UuidEntity } from '../../../common/uuid.entity'
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

@Entity('user_sessions')
export class UserSession extends UuidEntity {

  @Column()
  @ApiHideProperty()
  access: string

  @Column()
  @ApiHideProperty()
  refresh: string

  @Column()
  @ApiHideProperty()
  expiration: Date

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  location: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  device_type: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  ip_address: string

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  user_agent: string

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ format: 'date-time' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ format: 'date-time' })
  last_active_at: Date

  // relations

  @Column()
  @ApiHideProperty()
  user_id: string

  @ManyToOne(
    () => User,
    (user) => user.sessions,
  )
  @JoinColumn({ name: 'user_id' })
  @ApiHideProperty()
  user: User
}
