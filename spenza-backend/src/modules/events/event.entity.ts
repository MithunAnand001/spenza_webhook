import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { EventType } from './event-type.entity';
import { WebhookEventLog } from './webhook-event-log.entity';

@Entity('events')
export class Event extends BaseEntity {
  @Column({ name: 'event_type_id', type: 'int' })
  eventTypeId: number;

  @ManyToOne(() => EventType, (et) => et.events)
  @JoinColumn({ name: 'event_type_id' })
  eventType: EventType;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'schema_definition', type: 'jsonb', nullable: true })
  schemaDefinition: Record<string, unknown> | null;

  @OneToMany(() => WebhookEventLog, (log) => log.event)
  logs: WebhookEventLog[];
}