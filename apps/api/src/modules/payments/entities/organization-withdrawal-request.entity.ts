import { Entity, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UuidEntity } from '../../../common/uuid.entity'

export enum OrganizationWithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

@Entity('organization_withdrawal_requests')
export class OrganizationWithdrawalRequest extends UuidEntity {
  @Index('idx_withdrawal_org_id')
  @Column('uuid', { name: 'organization_id' })
  @ApiProperty({ format: 'uuid' })
  organizationId: string

  @Column('decimal', { precision: 12, scale: 2 })
  @ApiProperty()
  amount: number

  @Column('varchar', { length: 3 })
  @ApiProperty()
  currency: string

  @Index('idx_withdrawal_status')
  @Column('enum', { enum: OrganizationWithdrawalStatus, default: OrganizationWithdrawalStatus.PENDING })
  @ApiProperty({ enum: OrganizationWithdrawalStatus })
  status: OrganizationWithdrawalStatus

  @Column('varchar', { length: 255 })
  @ApiProperty({ description: 'Where the organization wants to receive payout (card, IBAN, etc.)' })
  destination: string

  @Column('text', { nullable: true })
  @ApiPropertyOptional({ nullable: true })
  comment: string | null

  @Column('text', { nullable: true, name: 'admin_comment' })
  @ApiPropertyOptional({ nullable: true })
  adminComment: string | null

  @Column({ type: 'timestamptz', nullable: true, name: 'processed_at' })
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  processedAt: Date | null

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  @ApiProperty({ format: 'date-time' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  @ApiProperty({ format: 'date-time' })
  updatedAt: Date
}
