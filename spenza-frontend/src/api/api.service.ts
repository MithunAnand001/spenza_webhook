import api from './axios';
import { ENDPOINTS } from '../constants/endpoints';
import type { AxiosResponse } from 'axios';

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
 * ApiService: Structured with generics to ensure type safety without 'any'.
 */
export const ApiService = {
  // Auth
  register: <T = any>(payload: unknown): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { url, method } = ENDPOINTS.AUTH.REGISTER;
    return api.request({ url, method, data: payload });
  },
  
  login: <T = any>(payload: unknown): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { url, method } = ENDPOINTS.AUTH.LOGIN;
    return api.request({ url, method, data: payload });
  },

  refresh: <T = any>(refreshToken: string): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { url, method } = ENDPOINTS.AUTH.REFRESH;
    return api.request({ url, method, data: { refreshToken } });
  },

  // Event Types
  getEventTypes: <T = any>(): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { url, method } = ENDPOINTS.EVENT_TYPES.LIST;
    return api.request({ url, method });
  },

  // Subscriptions
  getSubscriptions: <T = any>(): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { url, method } = ENDPOINTS.SUBSCRIPTIONS.LIST;
    return api.request({ url, method });
  },

  getSubscription: <T = any>(id: string | number): Promise<AxiosResponse<ApiResponse<T>>> => {
    const config = ENDPOINTS.SUBSCRIPTIONS.GET(id) as any;
    return api.request({ url: config.url, method: config.method });
  },

  createSubscription: <T = any>(payload: unknown): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { url, method } = ENDPOINTS.SUBSCRIPTIONS.CREATE;
    return api.request({ url, method, data: payload });
  },

  cancelSubscription: <T = any>(id: string | number): Promise<AxiosResponse<ApiResponse<T>>> => {
    const config = ENDPOINTS.SUBSCRIPTIONS.CANCEL(id) as any;
    return api.request({ url: config.url, method: config.method });
  },

  testUrl: <T = any>(urlToTest: string): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { url, method } = ENDPOINTS.SUBSCRIPTIONS.TEST_URL;
    return api.request({ url, method, data: { url: urlToTest } });
  },

  // Events
  getEvents: <T = any>(page: number, limit: number): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { url, method } = ENDPOINTS.EVENTS.LIST(page, limit);
    return api.request({ url, method });
  },

  getEventLog: <T = any>(id: string | number): Promise<AxiosResponse<ApiResponse<T>>> => {
    const config = ENDPOINTS.EVENTS.GET(id) as any;
    return api.request({ url: config.url, method: config.method });
  }
};
