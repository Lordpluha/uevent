import { Entity, Column, ManyToMany } from 'typeorm'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('tags')
export class Tag extends UuidEntity {

  @Column({ unique: true })
  name: string

  @Column({ nullable: true })
  description: string
}
