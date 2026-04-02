import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { File } from '../../files/entities/file.entity'
import { Event } from '../../events/entities/event.entity'
import { UuidEntity } from '../../../common/uuid.entity'
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum TicketStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  RESERVED = 'RESERVED',
  PAID = 'PAID',
}

@Entity('tickets')
export class Ticket extends UuidEntity {

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  image: string

  @Column()
  @ApiProperty()
  name: string

  @Index('idx_ticket_status')
  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.DRAFT })
  @ApiProperty({ enum: TicketStatus })
  status: TicketStatus

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  description: string

  @Column()
  @ApiProperty({ format: 'date-time' })
  datetime_start: Date

  @Column()
  @ApiProperty({ format: 'date-time' })
  datetime_end: Date

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty()
  price: number

  @Column({ default: false })
  @ApiProperty()
  quantity_limited: boolean

  @Column({ type: 'int', nullable: true })
  @ApiPropertyOptional({ nullable: true })
  quantity_total: number | null

  @Column({ type: 'int', default: 0 })
  @ApiProperty()
  quantity_sold: number

  @Column({ nullable: true, type: 'text' })
  @ApiPropertyOptional({ nullable: true })
  private_info: string

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ format: 'date-time' })
  created_at: Date

  // relations

  @Index('idx_ticket_user_id')
  @Column({ type: 'uuid', nullable: true })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  user_id: string | null

  @ManyToOne(
    () => User,
    (user) => user.tickets,
    { nullable: true },
  )
  @JoinColumn({ name: 'user_id' })
  @ApiHideProperty()
  user: User | null

  @OneToMany(
    () => File,
    (file) => file.ticket,
  )
  @ApiHideProperty()
  private_files: File[]

  @Index('idx_ticket_event_id')
  @Column({ type: 'uuid', nullable: true })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  event_id: string | null

  @ManyToOne(
    () => Event,
    (event) => event.tickets,
  )
  @JoinColumn({ name: 'event_id' })
  @ApiProperty({ type: () => Event })
  event: Event
}
