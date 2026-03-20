import type { LogFilterState } from '../types/api.types';

export const ENDPOINTS = {
  AUTH: {
    REGISTER: { url: '/auth/register', method: 'POST' },
    LOGIN: { url: '/auth/login', method: 'POST' },
    REFRESH: { url: '/auth/refresh', method: 'POST' },
  },
  EVENT_TYPES: {
    LIST: { url: '/event-types', method: 'GET' },
    GET: (id: string | number) => ({ url: `/event-types/${id}`, method: 'GET' }),
  },
  EVENTS: {
    LIST: (filters: LogFilterState) => {
      const { page, limit, status, eventTypeId, search, sortField, sortOrder } = filters;
      let url = `/events?page=${page}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      if (eventTypeId) url += `&eventTypeId=${eventTypeId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (sortField) url += `&sortField=${sortField}`;
      if (sortOrder) url += `&sortOrder=${sortOrder}`;
      return { url, method: 'GET' };
    },
    GET: (id: string | number) => ({ url: `/events/${id}`, method: 'GET' }),
    STREAM: (token: string) => ({ url: `/events/stream?token=${token}`, method: 'GET' }),
  },
  SUBSCRIPTIONS: {
    LIST: { url: '/subscriptions', method: 'GET' },
    CREATE: { url: '/subscriptions', method: 'POST' },
    GET: (id: string | number) => ({ url: `/subscriptions/${id}`, method: 'GET' }),
    CANCEL: (id: string | number) => ({ url: `/subscriptions/${id}/cancel`, method: 'PATCH' }),
    TEST_URL: { url: '/subscriptions/test-url', method: 'POST' },
  },
};
