import { Entity, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from './user.entity'
import { File } from '../../files/entities/file.entity'
import { Event } from '../../events/entities/event.entity'
import { UuidEntity } from '../../../common/uuid.entity'

export enum TicketStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  RESERVED = 'RESERVED',
  PAID = 'PAID',
}

@Entity('tickets')
export class Ticket extends UuidEntity {

  @Column({ nullable: true })
  image: string

  @Column()
  name: string

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.DRAFT })
  status: TicketStatus

  @Column({ nullable: true })
  description: string

  @Column()
  datetime_start: Date

  @Column()
  datetime_end: Date

  @Column('decimal', { precision: 10, scale: 2 })
  price: number

  @Column({ default: false })
  quantity_limited: boolean

  @Column({ type: 'int', nullable: true })
  quantity_total: number | null

  @Column({ type: 'int', default: 0 })
  quantity_sold: number

  @Column({ nullable: true, type: 'text' })
  private_info: string

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

  // relations

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null

  @ManyToOne(
    () => User,
    (user) => user.tickets,
    { nullable: true },
  )
  @JoinColumn({ name: 'user_id' })
  user: User | null

  @OneToMany(
    () => File,
    (file) => file.ticket,
  )
  private_files: File[]

  @Column({ type: 'uuid', nullable: true })
  event_id: string | null

  @ManyToOne(
    () => Event,
    (event) => event.tickets,
  )
  @JoinColumn({ name: 'event_id' })
  event: Event
}
