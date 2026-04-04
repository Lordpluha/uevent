import { PrimaryColumn, BeforeInsert } from 'typeorm'
import { uuidv7 } from 'uuidv7'
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
