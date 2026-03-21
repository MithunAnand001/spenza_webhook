import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { User } from '../../auth/entities/user.entity';
import { Event } from './event.entity';
import { UserEventMapping } from '../../subscriptions/entities/user-event-mapping.entity';

export enum EventLogStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

@Entity('webhook_event_logs')
export class WebhookEventLog extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User, (u) => u.eventLogs)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'event_id', type: 'int' })
  eventId: number;

  @ManyToOne(() => Event, (e) => e.logs)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ name: 'mapping_id', type: 'int', nullable: true })
  mappingId: number | null;

  @ManyToOne(() => UserEventMapping)
  @JoinColumn({ name: 'mapping_id' })
  mapping: UserEventMapping;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: EventLogStatus,
    default: EventLogStatus.PENDING,
  })
  @Index()
  status: EventLogStatus;

  @Column({ name: 'correlation_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  correlationId: string | null;

  @Column({ name: 'attempt_number', type: 'int', default: 0 })
  attemptNumber: number;

  @Column({ name: 'response_code', type: 'int', nullable: true })
  responseCode: number | null;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody: string | null;

  @Column({ name: 'next_retry_at', type: 'timestamptz', nullable: true })
  nextRetryAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;
}
