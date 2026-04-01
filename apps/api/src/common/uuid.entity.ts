import { PrimaryColumn, BeforeInsert } from 'typeorm'
import { v7 as uuidv7 } from 'uuid'
import { ApiProperty } from '@nestjs/swagger'

export abstract class UuidEntity {
  @PrimaryColumn('uuid')
  @ApiProperty({ format: 'uuid' })
  id: string

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv7()
  }
}
