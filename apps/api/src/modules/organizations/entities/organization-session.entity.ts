import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';

@Entity('organization_sessions')
export class OrganizationSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  access: string;

  @Column()
  refresh: string;

  @Column()
  expiration: Date;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  device_type: string;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ default: false })
  two_fa: boolean;

  // relations

  @Column()
  organization_id: number;

  @ManyToOne(() => Organization, (org) => org.sessions)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
