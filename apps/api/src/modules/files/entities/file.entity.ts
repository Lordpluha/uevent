import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ticket } from '../../users/entities/ticket.entity';

@Entity('files')
export class File {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    size: number;

    @Column()
    src: string;

    // relations

    @Column()
    ticket_id: number;

    @ManyToOne(() => Ticket, (ticket) => ticket.private_files)
    @JoinColumn({ name: 'ticket_id' })
    ticket: Ticket;
}