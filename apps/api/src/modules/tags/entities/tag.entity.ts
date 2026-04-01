import { Entity, Column } from 'typeorm'
import { UuidEntity } from '../../../common/uuid.entity'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

@Entity('tags')
export class Tag extends UuidEntity {

  @Column({ unique: true })
  @ApiProperty()
  name: string

  @Column({ nullable: true })
  @ApiPropertyOptional({ nullable: true })
  description: string
}
