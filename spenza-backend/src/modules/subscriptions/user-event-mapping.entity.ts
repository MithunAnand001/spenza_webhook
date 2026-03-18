import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { User } from '../auth/user.entity';
import { EventType } from '../events/event-type.entity';

@Entity('user_event_mapping')
@Unique(['userId', 'eventTypeId'])
export class UserEventMapping extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  @Index()
  userId: number;

  @ManyToOne(() => User, (u) => u.eventMappings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'event_type_id', type: 'int' })
  eventTypeId: number;

  @ManyToOne(() => EventType, (et) => et.userMappings)
  @JoinColumn({ name: 'event_type_id' })
  eventType: EventType;

  @Column({ name: 'callback_url', type: 'varchar', length: 500 })
  callbackUrl: string;
}