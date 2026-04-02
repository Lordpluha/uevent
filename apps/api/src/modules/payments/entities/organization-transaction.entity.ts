import { Entity, Column, CreateDateColumn } from 'typeorm'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UuidEntity } from '../../../common/uuid.entity'

export enum OrganizationTransactionType {
  SALE = 'sale',
  REFUND = 'refund',
  WITHDRAWAL_REQUEST = 'withdrawal_request',
}

@Entity('organization_transactions')
export class OrganizationTransaction extends UuidEntity {
  @Column('uuid')
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

  @Column('uuid', { nullable: true })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  sourcePaymentId: string | null

  @Column('varchar', { nullable: true })
  @ApiPropertyOptional({ nullable: true })
  sourcePaymentIntentId: string | null

  @Column('uuid', { nullable: true })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  sourceWithdrawalRequestId: string | null

  @Column('varchar', { nullable: true })
  @ApiPropertyOptional({ nullable: true })
  eventTitle: string | null

  @Column('varchar', { nullable: true })
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

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ format: 'date-time' })
  createdAt: Date
}
