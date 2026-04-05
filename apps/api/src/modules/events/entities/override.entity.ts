import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { UuidEntity } from '../../../common/uuid.entity'
import { Recurrence } from './recurrence.entity'

@Entity('overrides')
export class Override extends UuidEntity {
  @Column({ type: 'timestamptz', nullable: true })
  @ApiProperty({ format: 'date-time', description: 'The original start date this override replaces' })
  original_start: Date | null

  @Column()
  @ApiProperty({ format: 'date-time' })
  new_start: Date

  @Column()
  @ApiProperty({ format: 'date-time' })
  new_end: Date

  @Column({ default: false })
  @ApiProperty()
  is_canceled: boolean

  // relations

  @Column()
  @ApiProperty({ format: 'uuid' })
  recurrence_id: string

  @ManyToOne(
    () => Recurrence,
    (recurrence) => recurrence.overrides,
  )
  @JoinColumn({ name: 'recurrence_id' })
  @ApiProperty({ type: () => Recurrence })
  recurrence: Recurrence
}
