import {
  Entity,
  Column,
  Index,
  ManyToMany,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
  JoinTable,
} from 'typeorm'
import { Tag } from '../../tags/entities/tag.entity'
import { Recurrence } from './recurrence.entity'
import { Ticket } from '../../tickets/entities/ticket.entity'
import { Organization } from '../../organizations/entities/organization.entity'
import { UuidEntity } from '../../../common/uuid.entity'
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

@Entity('events')
export class Event extends UuidEntity {

  @Column()
  @ApiProperty()
  name: string

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  description: string

  @Column({ type: 'simple-array', nullable: true })
  @ApiPropertyOptional({ type: [String], nullable: true })
  gallery: string[]

  @Column()
  @ApiProperty()
  time_zone: string

  @Column()
  @ApiProperty({ format: 'date-time' })
  datetime_start: Date

  @Column()
  @ApiProperty({ format: 'date-time' })
  datetime_end: Date

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  seats: number

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  location: string

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  location_map_url: string | null

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  online_link: string | null

  @Column({ type: 'varchar', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  location_from: string | null

  @Column({ type: 'varchar', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  location_to: string | null

  // relations

  @ManyToMany(() => Tag)
  @JoinTable({ name: 'event_tags' })
  @ApiProperty({ type: () => [Tag] })
  tags: Tag[]

  @OneToOne(() => Recurrence)
  @JoinColumn()
  @ApiHideProperty()
  recurrence: Recurrence

  @OneToMany(
    () => Ticket,
    (ticket) => ticket.event,
  )
  @ApiHideProperty()
  tickets: Ticket[]

  @ManyToOne(
    () => Organization,
    (organization) => organization.events,
  )
  @JoinColumn({ name: 'organization_id' })
  @ApiHideProperty()
  organization: Organization

  @Index('idx_event_organization_id')
  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  organization_id: string

  @Column({ default: false })
  @ApiProperty()
  attendees_public: boolean

  @Column({ default: false })
  @ApiProperty()
  notify_new_attendees: boolean

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  redirect_url: string | null

  @Column({ type: 'timestamptz', nullable: true })
  @ApiPropertyOptional({ nullable: true, format: 'date-time' })
  publish_at: Date | null
}
