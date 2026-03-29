import { Entity, Column, OneToMany } from 'typeorm'
import { Override } from './override.entity'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('recurrences')
export class Recurrence extends UuidEntity {

  @Column()
  rule: string

  @Column()
  time_zone: string

  @Column({ type: 'simple-array', nullable: true })
  excluded_dates: string[]

  @Column({ type: 'simple-array', nullable: true })
  additional_dates: string[]

  // relations

  @OneToMany(
    () => Override,
    (override) => override.recurrence,
  )
  overrides: Override[]
}
