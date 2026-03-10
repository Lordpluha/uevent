import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Recurrence } from './recurrence.entity'

@Entity('overrides')
export class Override {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  new_start: Date

  @Column()
  new_end: Date

  @Column({ default: false })
  is_canceled: boolean

  // relations

  @Column()
  recurrence_id: number

  @ManyToOne(
    () => Recurrence,
    (recurrence) => recurrence.overrides,
  )
  @JoinColumn({ name: 'recurrence_id' })
  recurrence: Recurrence
}
