import { Entity, Column, Index, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Organization } from '../../organizations/entities/organization.entity'
import { UuidEntity } from '../../../common/uuid.entity'
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

@Entity('notifications')
export class Notification extends UuidEntity {

  @Column()
  @ApiProperty()
  name: string

  @Column({ type: 'text' })
  @ApiProperty()
  content: string

  @CreateDateColumn({ name: 'created' })
  @ApiProperty({ format: 'date-time' })
  created_at: Date

  @Column({ name: 'had_readed', default: false })
  @ApiProperty()
  is_read: boolean

  @Column({ nullable: true, type: 'varchar' })
  @ApiPropertyOptional({ nullable: true })
  link: string | null

  // relations

  @Index('idx_notification_user_id')
  @Column({ type: 'uuid', nullable: true })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  user_id: string | null

  @ManyToOne(
    () => User,
    (user) => user.notifications,
    { nullable: true },
  )
  @JoinColumn({ name: 'user_id' })
  @ApiHideProperty()
  user: User | null

  @Index('idx_notification_org_id')
  @Column({ type: 'uuid', nullable: true })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  organization_id: string | null

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  @ApiHideProperty()
  organization: Organization | null
}
