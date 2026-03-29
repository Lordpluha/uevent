import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Organization } from '../../organizations/entities/organization.entity'
import { UuidEntity } from '../../../common/uuid.entity'

@Entity('notifications')
export class Notification extends UuidEntity {

  @Column()
  name: string

  @Column({ type: 'text' })
  content: string

  @CreateDateColumn()
  created: Date

  @Column({ default: false })
  had_readed: boolean

  // relations

  @Column({ nullable: true })
  user_id: string | null

  @ManyToOne(
    () => User,
    (user) => user.notifications,
    { nullable: true },
  )
  @JoinColumn({ name: 'user_id' })
  user: User | null

  @Column({ nullable: true })
  organization_id: string | null

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization | null
}
