import { PrimaryColumn, BeforeInsert } from 'typeorm'
import { v7 as uuidv7 } from 'uuid'

export abstract class UuidEntity {
  @PrimaryColumn('uuid')
  id: string

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv7()
  }
}
