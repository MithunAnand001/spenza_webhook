import { WebhookEventStatus } from '../constants/status';

// Auth DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface RefreshResult {
  accessToken: string;
}

// Event Types
export interface EventType {
  uuid: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
  createdOn: string;
  modifiedOn: string;
  isActive: boolean;
}

// Subscriptions
export interface UserEventMapping {
  uuid: string;
  callbackUrl: string;
  createdOn: string;
  isActive: boolean;
  eventType?: EventType;
}

export interface CreateSubscriptionDto {
  eventTypeUuid: string;
  callbackUrl: string;
  authenticationType?: 'none' | 'basic' | 'bearer' | 'hmac';
  callbackUsername?: string;
  callbackPassword?: string;
  callbackBearerToken?: string;
}

export interface CreateSubscriptionResult {
  subscription: UserEventMapping;
  signingSecret: string;
}

export interface TestUrlResult {
  success: boolean;
  message?: string;
}

// Webhook Logs
export interface WebhookEventLog {
  uuid: string;
  payload: any;
  status: WebhookEventStatus;
  correlationId: string | null;
  attemptNumber: number;
  responseCode: number | null;
  responseBody: string | null;
  createdOn: string;
  deliveredAt: string | null;
  nextRetryAt: string | null;
  event?: {
    eventType?: EventType;
  };
}

export interface LogFilterState {
  page: number;
  limit: number;
  status: WebhookEventStatus | '';
  eventTypeUuid?: string;
  search: string;
  sortField: string;
  sortOrder: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
