import { Entity, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('promo_codes')
export class PromoCode extends UuidEntity {
  @Column({ type: 'varchar', length: 64 })
  @Index('idx_promo_code_unique_code', { unique: true })
  @ApiProperty()
  code: string

  @Column({ type: 'int', name: 'discount_percent' })
  @ApiProperty({ minimum: 1, maximum: 100 })
  discountPercent: number

  @Column({ type: 'uuid', name: 'organization_id' })
  @Index('idx_promo_code_org_id')
  @ApiProperty({ format: 'uuid' })
  organizationId: string

  @Column({ type: 'uuid', nullable: true, name: 'event_id' })
  @Index('idx_promo_code_event_id')
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  eventId: string | null

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @ApiProperty()
  isActive: boolean

  @Column({ type: 'int', nullable: true, name: 'max_uses' })
  @ApiPropertyOptional({ nullable: true })
  maxUses: number | null

  @Column({ type: 'int', default: 0, name: 'used_count' })
  @ApiProperty()
  usedCount: number

  @Column({ type: 'timestamptz', nullable: true, name: 'starts_at' })
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  startsAt: Date | null

  @Column({ type: 'timestamptz', nullable: true, name: 'ends_at' })
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  endsAt: Date | null

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  @ApiProperty({ format: 'date-time' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  @ApiProperty({ format: 'date-time' })
  updatedAt: Date
}
