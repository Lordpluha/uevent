import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { UuidEntity } from '../../../common/uuid.entity'
import { User } from '../../users/entities/user.entity'
import { Event } from './event.entity'

@Entity('event_comments')
export class EventComment extends UuidEntity {
  @Column({ type: 'text' })
  @ApiProperty()
  content: string

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ format: 'date-time' })
  created_at: Date

  // relations

  @Index('idx_event_comment_event_id')
  @Column({ type: 'uuid' })
  @ApiProperty({ format: 'uuid' })
  event_id: string

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  @ApiHideProperty()
  event: Event

  @Index('idx_event_comment_user_id')
  @Column({ type: 'uuid' })
  @ApiProperty({ format: 'uuid' })
  user_id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @ApiPropertyOptional({ type: () => Object })
  user: User
}
