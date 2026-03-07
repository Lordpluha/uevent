import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { File } from '../../files/entities/file.entity';
import { Event } from '../../events/entities/event.entity';

export enum TicketStatus {
    DRAFT = 'DRAFT',
    READY = 'READY',
    RESERVED = 'RESERVED',
    PAID = 'PAID',
}

@Entity('tickets')
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    image: string;

    @Column()
    name: string;

    @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.DRAFT })
    status: TicketStatus;

    @Column({ nullable: true })
    description: string;

    @Column()
    datetime_start: Date;

    @Column()
    datetime_end: Date;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({ nullable: true, type: 'text' })
    private_info: string;

    // relations

    @Column()
    user_id: number;

    @ManyToOne(() => User, (user) => user.tickets)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => File, (file) => file.ticket)
    private_files: File[];

    @Column({ nullable: true })
    event_id: number;

    @ManyToOne(() => Event, (event) => event.tickets)
    @JoinColumn({ name: 'event_id' })
    event: Event;
}