import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Column, Entity, OneToMany } from 'typeorm'
import { UuidEntity } from '../../../common/uuid.entity'
import { Override } from './override.entity'

@Entity('recurrences')
export class Recurrence extends UuidEntity {
  @Column()
  @ApiProperty()
  rule: string

  @Column()
  @ApiProperty()
  time_zone: string

  @Column({ type: 'simple-array', nullable: true })
  @ApiPropertyOptional({ type: [String], nullable: true })
  excluded_dates: string[]

  @Column({ type: 'simple-array', nullable: true })
  @ApiPropertyOptional({ type: [String], nullable: true })
  additional_dates: string[]

  // relations

  @OneToMany(
    () => Override,
    (override) => override.recurrence,
  )
  @ApiProperty({ type: () => [Override] })
  overrides: Override[]
}
