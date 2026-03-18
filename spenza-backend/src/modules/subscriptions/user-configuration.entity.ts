import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { User } from '../auth/user.entity';

export enum AuthenticationType {
  NONE = 'none',
  BASIC = 'basic',
  BEARER = 'bearer',
  HMAC = 'hmac',
}

@Entity('user_configurations')
export class UserConfiguration extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  @Index()
  userId: number;

  @ManyToOne(() => User, (u) => u.configurations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'health_check_url', type: 'varchar', length: 500, nullable: true })
  healthCheckUrl: string | null;

  @Column({
    name: 'authentication_type',
    type: 'enum',
    enum: AuthenticationType,
    default: AuthenticationType.NONE,
  })
  authenticationType: AuthenticationType;

  @Column({ name: 'callback_username', type: 'varchar', length: 255, nullable: true })
  callbackUsername: string | null;

  @Column({ name: 'callback_password', type: 'varchar', length: 255, nullable: true })
  callbackPassword: string | null;   // AES-256 encrypted

  @Column({ name: 'callback_bearer_token', type: 'varchar', length: 500, nullable: true })
  callbackBearerToken: string | null; // AES-256 encrypted

  @Column({ name: 'signing_secret', type: 'varchar', length: 255, nullable: true })
  signingSecret: string | null;

  @Column({ type: 'date', nullable: true })
  validity: Date | null;
}