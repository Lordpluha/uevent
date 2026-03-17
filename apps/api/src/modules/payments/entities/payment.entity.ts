import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELED = 'canceled',
}

@Entity('payments')
export class Payment {
  @PrimaryColumn('uuid')
  id: string

  @Column('varchar', { nullable: true })
  stripePaymentIntentId: string

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number

  @Column('varchar', { length: 3 })
  currency: string

  @Column('enum', { enum: PaymentStatus })
  status: PaymentStatus

  @Column('uuid', { nullable: true })
  userId: string

  @Column('uuid', { nullable: true })
  organizationId: string

  @Column('varchar', { nullable: true })
  orderId: string

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>

  @Column('text', { nullable: true })
  failureReason: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
