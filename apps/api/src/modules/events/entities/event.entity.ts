import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, OneToMany, OneToOne, JoinColumn, JoinTable, } from 'typeorm';
import { Tag } from '../../tags/entities/tag.entity';
import { Recurrence } from './recurrence.entity';
import { Ticket } from '../../users/entities/ticket.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  gallery: string[];

  @Column()
  time_zone: string;

  @Column()
  datetime_start: Date;

  @Column()
  datetime_end: Date;

  @Column({ nullable: true })
  seats: number;

  @Column({ nullable: true })
  location: string;

  // relations

  @ManyToMany(() => Tag)
  @JoinTable({ name: 'event_tags' })
  tags: Tag[];

  @OneToOne(() => Recurrence)
  @JoinColumn()
  recurrence: Recurrence;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];

  @Column({ nullable: true })
  organization_id: number;
}
