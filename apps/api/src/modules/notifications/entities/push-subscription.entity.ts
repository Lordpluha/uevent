import { Column, CreateDateColumn, Entity, Index } from 'typeorm'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('push_subscriptions')
export class PushSubscription extends UuidEntity {
  @Column({ type: 'text', unique: true })
  endpoint: string

  @Column({ type: 'text', nullable: true })
  p256dh: string | null

  @Column({ type: 'text', nullable: true })
  auth: string | null

  @Index('idx_push_subscription_user_id')
  @Column({ type: 'uuid', nullable: true })
  user_id: string | null

  @Index('idx_push_subscription_org_id')
  @Column({ type: 'uuid', nullable: true })
  organization_id: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date
}
