import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Recurrence } from './recurrence.entity'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('overrides')
export class Override extends UuidEntity {

  @Column()
  new_start: Date

  @Column()
  new_end: Date

  @Column({ default: false })
  is_canceled: boolean

  // relations

  @Column()
  recurrence_id: string

  @ManyToOne(
    () => Recurrence,
    (recurrence) => recurrence.overrides,
  )
  @JoinColumn({ name: 'recurrence_id' })
  recurrence: Recurrence
}
