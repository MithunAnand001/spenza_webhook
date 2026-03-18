import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { Event } from './event.entity';
import { UserEventMapping } from '../subscriptions/user-event-mapping.entity';

@Entity('event_types')
export class EventType extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ name: 'short_description', type: 'varchar', length: 255, nullable: true })
  shortDescription: string | null;

  @Column({ name: 'long_description', type: 'text', nullable: true })
  longDescription: string | null;

  @OneToMany(() => Event, (e) => e.eventType)
  events: Event[];

  @OneToMany(() => UserEventMapping, (uem) => uem.eventType)
  userMappings: UserEventMapping[];
}