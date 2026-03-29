import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Ticket } from '../../users/entities/ticket.entity'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('files')
export class File extends UuidEntity {

  @Column()
  name: string

  @Column()
  size: number

  @Column()
  src: string

  // relations

  @Column({ type: 'uuid', nullable: true })
  ticket_id: string | null

  @ManyToOne(
    () => Ticket,
    (ticket) => ticket.private_files,
    { nullable: true },
  )
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket | null
}
