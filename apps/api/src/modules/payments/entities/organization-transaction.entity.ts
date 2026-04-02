import { Entity, Column, Index, CreateDateColumn } from 'typeorm'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UuidEntity } from '../../../common/uuid.entity'

export enum OrganizationTransactionType {
  SALE = 'sale',
  REFUND = 'refund',
  WITHDRAWAL_REQUEST = 'withdrawal_request',
}

@Entity('organization_transactions')
export class OrganizationTransaction extends UuidEntity {
  @Index('idx_org_transaction_org_id')
  @Column('uuid', { name: 'organization_id' })
  @ApiProperty({ format: 'uuid' })
  organizationId: string

  @Column('enum', { enum: OrganizationTransactionType })
  @ApiProperty({ enum: OrganizationTransactionType })
  type: OrganizationTransactionType

  @Column('decimal', { precision: 12, scale: 2 })
  @ApiProperty()
  amount: number

  @Column('varchar', { length: 3 })
  @ApiProperty()
  currency: string

  @Column('uuid', { nullable: true, name: 'source_payment_id' })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  sourcePaymentId: string | null

  @Column('varchar', { nullable: true, name: 'source_payment_intent_id' })
  @ApiPropertyOptional({ nullable: true })
  sourcePaymentIntentId: string | null

  @Column('uuid', { nullable: true, name: 'source_withdrawal_request_id' })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  sourceWithdrawalRequestId: string | null

  @Column('varchar', { nullable: true, name: 'event_title' })
  @ApiPropertyOptional({ nullable: true })
  eventTitle: string | null

  @Column('varchar', { nullable: true, name: 'ticket_title' })
  @ApiPropertyOptional({ nullable: true })
  ticketTitle: string | null

  @Column('int', { nullable: true })
  @ApiPropertyOptional({ nullable: true })
  quantity: number | null

  @Column('text', { nullable: true })
  @ApiPropertyOptional({ nullable: true })
  note: string | null

  @Column('jsonb', { nullable: true })
  @ApiPropertyOptional({ nullable: true })
  metadata: Record<string, string> | null

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  @ApiProperty({ format: 'date-time' })
  createdAt: Date
}
