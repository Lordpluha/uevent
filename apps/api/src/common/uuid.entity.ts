import { ApiProperty } from '@nestjs/swagger'
import { BeforeInsert, PrimaryColumn } from 'typeorm'
import { uuidv7 } from 'uuidv7'

export abstract class UuidEntity {
  @PrimaryColumn('uuid')
  @ApiProperty({ format: 'uuid' })
  id: string

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv7()
  }
}
