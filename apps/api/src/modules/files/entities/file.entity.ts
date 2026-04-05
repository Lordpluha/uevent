import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { UuidEntity } from '../../../common/uuid.entity'
import { Ticket } from '../../tickets/entities/ticket.entity'

@Entity('files')
export class File extends UuidEntity {
  @Column()
  @ApiProperty()
  name: string

  @Column()
  @ApiProperty()
  size: number

  @Column()
  @ApiProperty()
  src: string

  // relations

  @Column({ type: 'uuid', nullable: true })
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ticket_id: string | null

  @ManyToOne(
    () => Ticket,
    (ticket) => ticket.private_files,
    { nullable: true },
  )
  @JoinColumn({ name: 'ticket_id' })
  @ApiPropertyOptional({ type: () => Ticket, nullable: true })
  ticket: Ticket | null
}
