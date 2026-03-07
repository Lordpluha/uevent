import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Override } from './override.entity';

@Entity('recurrences')
export class Recurrence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rule: string;

  @Column()
  time_zone: string;

  @Column({ type: 'simple-array', nullable: true })
  excluded_dates: string[];

  @Column({ type: 'simple-array', nullable: true })
  additional_dates: string[];

  // relations

  @OneToMany(() => Override, (override) => override.recurrence)
  overrides: Override[];
}
