import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { UserConfiguration } from '../../subscriptions/entities/user-configuration.entity';
import { UserEventMapping } from '../../subscriptions/entities/user-event-mapping.entity';
import { WebhookEventLog } from '../../events/entities/webhook-event-log.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'email_id', type: 'varchar', length: 255, unique: true })
  emailId: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 255 })
  password: string;           // bcrypt hashed

  @OneToMany(() => UserConfiguration, (uc) => uc.user)
  configurations: UserConfiguration[];

  @OneToMany(() => UserEventMapping, (uem) => uem.user)
  eventMappings: UserEventMapping[];

  @OneToMany(() => WebhookEventLog, (log) => log.user)
  eventLogs: WebhookEventLog[];
}
