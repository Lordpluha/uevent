import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ type: 'text' })
  content: string

  @CreateDateColumn()
  created: Date

  @Column({ default: false })
  had_readed: boolean

  // relations

  @Column()
  user_id: string

  @ManyToOne(
    () => User,
    (user) => user.notifications,
  )
  @JoinColumn({ name: 'user_id' })
  user: User
}
