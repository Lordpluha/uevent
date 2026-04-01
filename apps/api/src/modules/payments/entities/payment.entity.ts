import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

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
  @ApiProperty({ format: 'uuid' })
  id: string

  @Column('varchar', { nullable: true })
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

  @Column('uuid', { nullable: true })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId: string

  @Column('uuid', { nullable: true })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  organizationId: string

  @Column('varchar', { nullable: true })
  @ApiPropertyOptional({ nullable: true })
  orderId: string

  @Column('jsonb', { nullable: true })
  @ApiPropertyOptional({ nullable: true })
  metadata: Record<string, string>

  @Column('text', { nullable: true })
  @ApiPropertyOptional({ nullable: true })
  failureReason: string

  @CreateDateColumn()
  @ApiProperty({ format: 'date-time' })
  createdAt: Date

  @UpdateDateColumn()
  @ApiProperty({ format: 'date-time' })
  updatedAt: Date
}
