import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UuidEntity } from '../../../common/uuid.entity'

export enum OrganizationVerificationStatus {
  NOT_SUBMITTED = 'not_submitted',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('organization_verifications')
export class OrganizationVerification extends UuidEntity {
  @Column('uuid', { unique: true, name: 'organization_id' })
  @ApiProperty({ format: 'uuid' })
  organizationId: string

  @Column('enum', { enum: OrganizationVerificationStatus, default: OrganizationVerificationStatus.NOT_SUBMITTED })
  @ApiProperty({ enum: OrganizationVerificationStatus })
  status: OrganizationVerificationStatus

  @Column('text', { nullable: true, name: 'additional_information' })
  @ApiPropertyOptional({ nullable: true })
  additionalInformation: string | null

  @Column('jsonb', { nullable: true, name: 'document_urls' })
  @ApiPropertyOptional({ type: [String], nullable: true })
  documentUrls: string[] | null

  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  submittedAt: Date | null

  @Column({ type: 'timestamptz', nullable: true, name: 'reviewed_at' })
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  reviewedAt: Date | null

  @Column('text', { nullable: true, name: 'reviewer_comment' })
  @ApiPropertyOptional({ nullable: true })
  reviewerComment: string | null

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  @ApiProperty({ format: 'date-time' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  @ApiProperty({ format: 'date-time' })
  updatedAt: Date
}
