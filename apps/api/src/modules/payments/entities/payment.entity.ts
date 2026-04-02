import { Entity, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UuidEntity } from '../../../common/uuid.entity'

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELED = 'canceled',
}

@Entity('payments')
export class Payment extends UuidEntity {
  @Index('idx_payment_stripe_intent_id')
  @Column('varchar', { nullable: true, name: 'stripe_payment_intent_id' })
  @ApiPropertyOptional({ nullable: true })
  stripePaymentIntentId: string

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty()
  amount: number

  @Column('varchar', { length: 3 })
  @ApiProperty()
  currency: string

  @Column('enum', { enum: PaymentStatus })
  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus

  @Column('uuid', { nullable: true, name: 'user_id' })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId: string

  @Column('uuid', { nullable: true, name: 'organization_id' })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  organizationId: string

  @Column('varchar', { nullable: true, name: 'order_id' })
  @ApiPropertyOptional({ nullable: true })
  orderId: string

  @Column('jsonb', { nullable: true })
  @ApiPropertyOptional({ nullable: true })
  metadata: Record<string, string>

  @Column('text', { nullable: true, name: 'failure_reason' })
  @ApiPropertyOptional({ nullable: true })
  failureReason: string

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  @ApiProperty({ format: 'date-time' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  @ApiProperty({ format: 'date-time' })
  updatedAt: Date
}
