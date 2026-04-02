import { Entity, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('promo_codes')
export class PromoCode extends UuidEntity {
  @Column({ type: 'varchar', length: 64, unique: true })
  @Index('idx_promo_code_unique_code', { unique: true })
  @ApiProperty()
  code: string

  @Column({ type: 'int' })
  @ApiProperty({ minimum: 1, maximum: 100 })
  discountPercent: number

  @Column({ type: 'uuid' })
  @Index('idx_promo_code_org_id')
  @ApiProperty({ format: 'uuid' })
  organizationId: string

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_promo_code_event_id')
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  eventId: string | null

  @Column({ type: 'boolean', default: true })
  @ApiProperty()
  isActive: boolean

  @Column({ type: 'int', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  maxUses: number | null

  @Column({ type: 'int', default: 0 })
  @ApiProperty()
  usedCount: number

  @Column({ type: 'timestamptz', nullable: true })
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  startsAt: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  endsAt: Date | null

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ format: 'date-time' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ format: 'date-time' })
  updatedAt: Date
}
