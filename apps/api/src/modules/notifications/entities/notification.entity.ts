import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
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

  @CreateDateColumn()
  @ApiProperty({ format: 'date-time' })
  created: Date

  @Column({ default: false })
  @ApiProperty()
  had_readed: boolean

  // relations

  @Column({ nullable: true })
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

  @Column({ nullable: true })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  organization_id: string | null

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  @ApiHideProperty()
  organization: Organization | null
}
