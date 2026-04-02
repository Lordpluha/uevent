import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('event_subscriptions')
export class EventSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index('idx_event_sub_user_id')
  @Column({ type: 'uuid' })
  user_id: string

  @Index('idx_event_sub_event_id')
  @Column({ type: 'uuid' })
  event_id: string

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date
}
