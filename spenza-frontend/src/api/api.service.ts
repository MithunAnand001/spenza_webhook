import api from './axios';
import { ENDPOINTS } from '../constants/endpoints';
import type { AxiosResponse } from 'axios';
import type { LoginResult } from '../types/auth.types';
import type {
  LoginDto,
  RegisterDto,
  RefreshResult,
  EventType,
  UserEventMapping,
  CreateSubscriptionDto,
  CreateSubscriptionResult,
  TestUrlResult,
  WebhookEventLog,
  PaginatedResponse
} from '../types/api.types';

export interface ApiError {
  message: string;
  field?: string;
  code: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  requestID: string;
  errors: ApiError[];
}

/**
 * ApiService: Strongly typed to ensure strict data passing.
 */
export const ApiService = {
  // Auth
  register: (payload: RegisterDto): Promise<AxiosResponse<ApiResponse<LoginResult>>> => {
    const { url, method } = ENDPOINTS.AUTH.REGISTER;
    return api.request({ url, method, data: payload });
  },
  
  login: (payload: LoginDto): Promise<AxiosResponse<ApiResponse<LoginResult>>> => {
    const { url, method } = ENDPOINTS.AUTH.LOGIN;
    return api.request({ url, method, data: payload });
  },

  refresh: (refreshToken: string): Promise<AxiosResponse<ApiResponse<RefreshResult>>> => {
    const { url, method } = ENDPOINTS.AUTH.REFRESH;
    return api.request({ url, method, data: { refreshToken } });
  },

  // Event Types
  getEventTypes: (): Promise<AxiosResponse<ApiResponse<EventType[]>>> => {
    const { url, method } = ENDPOINTS.EVENT_TYPES.LIST;
    return api.request({ url, method });
  },

  // Subscriptions
  getSubscriptions: (): Promise<AxiosResponse<ApiResponse<UserEventMapping[]>>> => {
    const { url, method } = ENDPOINTS.SUBSCRIPTIONS.LIST;
    return api.request({ url, method });
  },

  getSubscription: (id: string | number): Promise<AxiosResponse<ApiResponse<UserEventMapping>>> => {
    const config = ENDPOINTS.SUBSCRIPTIONS.GET(id);
    return api.request({ url: config.url, method: config.method });
  },

  createSubscription: (payload: CreateSubscriptionDto): Promise<AxiosResponse<ApiResponse<CreateSubscriptionResult>>> => {
    const { url, method } = ENDPOINTS.SUBSCRIPTIONS.CREATE;
    return api.request({ url, method, data: payload });
  },

  cancelSubscription: (id: string | number): Promise<AxiosResponse<ApiResponse<UserEventMapping>>> => {
    const config = ENDPOINTS.SUBSCRIPTIONS.CANCEL(id);
    return api.request({ url: config.url, method: config.method });
  },

  testUrl: (urlToTest: string): Promise<AxiosResponse<ApiResponse<TestUrlResult>>> => {
    const { url, method } = ENDPOINTS.SUBSCRIPTIONS.TEST_URL;
    return api.request({ url, method, data: { url: urlToTest } });
  },

  // Events
  getEvents: (
    page: number, 
    limit: number, 
    status?: string, 
    eventTypeId?: number, 
    search?: string, 
    sortField?: string, 
    sortOrder?: string
  ): Promise<AxiosResponse<ApiResponse<PaginatedResponse<WebhookEventLog>>>> => {
    const { url, method } = ENDPOINTS.EVENTS.LIST(page, limit, status, eventTypeId, search, sortField, sortOrder);
    return api.request({ url, method });
  },

  getEventLog: (id: string | number): Promise<AxiosResponse<ApiResponse<WebhookEventLog>>> => {
    const config = ENDPOINTS.EVENTS.GET(id);
    return api.request({ url: config.url, method: config.method });
  }
};
