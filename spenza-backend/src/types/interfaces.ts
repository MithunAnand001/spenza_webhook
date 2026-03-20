import { User } from '../modules/auth/user.entity';
import { EventType } from '../modules/events/event-type.entity';
import { Event } from '../modules/events/event.entity';
import { UserEventMapping } from '../modules/subscriptions/user-event-mapping.entity';
import { UserConfiguration } from '../modules/subscriptions/user-configuration.entity';
import { WebhookEventLog } from '../modules/events/webhook-event-log.entity';
import { RegisterDto, LoginDto } from '../modules/auth/auth.dto';
import { LoginResult } from './auth.types';
import { CreateSubscriptionDto } from '../modules/subscriptions/subscriptions.dto';

// Utils
export interface ILogger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

// Repositories
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  findByUuid(uuid: string): Promise<User | null>;
  save(user: Partial<User>): Promise<User>;
}

export interface IEventTypeRepository {
  findAllActive(): Promise<EventType[]>;
  findById(id: number): Promise<EventType | null>;
  findByUuid(uuid: string): Promise<EventType | null>;
}

export interface IEventRepository {
  findByEventTypeId(eventTypeId: number): Promise<Event | null>;
  findByUuid(uuid: string): Promise<Event | null>;
  save(event: Partial<Event>): Promise<Event>;
}

export interface IUserEventMappingRepository {
  findActive(userId: number, eventTypeId: number): Promise<UserEventMapping | null>;
  findByUserId(userId: number): Promise<UserEventMapping[]>;
  findByIdAndUser(id: number, userId: number): Promise<UserEventMapping | null>;
  findByUuidAndUser(uuid: string, userId: number): Promise<UserEventMapping | null>;
  findById(id: number): Promise<UserEventMapping | null>;
  findByUuid(uuid: string): Promise<UserEventMapping | null>;
  save(mapping: Partial<UserEventMapping>): Promise<UserEventMapping>;
}

export interface IUserConfigurationRepository {
  findByUserId(userId: number): Promise<UserConfiguration | null>;
  save(config: Partial<UserConfiguration>): Promise<UserConfiguration>;
}

export interface IWebhookLogRepository {
  findById(id: number): Promise<WebhookEventLog | null>;
  findByUuid(uuid: string): Promise<WebhookEventLog | null>;
  findByUuidAndUser(uuid: string, userId: number): Promise<WebhookEventLog | null>;
  findAndCount(options: any): Promise<[WebhookEventLog[], number]>;
  findOne(options: any): Promise<WebhookEventLog | null>;
  save(log: Partial<WebhookEventLog>): Promise<WebhookEventLog>;
}

// Services
export interface IAuthService {
  register(dto: RegisterDto): Promise<LoginResult>;
  login(dto: LoginDto): Promise<LoginResult>;
}

export interface ISubscriptionsService {
  createSubscription(userId: number, dto: CreateSubscriptionDto): Promise<any>;
  listSubscriptions(userId: number): Promise<UserEventMapping[]>;
  getSubscription(userId: number, uuid: string): Promise<UserEventMapping>;
  cancelSubscription(userId: number, uuid: string): Promise<UserEventMapping>;
}

export interface IWebhookIngestService {
  ingest(subscriptionUuid: string, payload: any, signature?: string, correlationId?: string): Promise<any>;
}
