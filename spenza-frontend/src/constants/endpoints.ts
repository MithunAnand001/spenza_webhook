import type { LogFilterState } from '../types/api.types';

export const ENDPOINTS = {
  AUTH: {
    REGISTER: { url: '/auth/register', method: 'POST' },
    LOGIN: { url: '/auth/login', method: 'POST' },
    REFRESH: { url: '/auth/refresh', method: 'POST' },
  },
  EVENT_TYPES: {
    LIST: { url: '/event-types', method: 'GET' },
    GET: (uuid: string) => ({ url: `/event-types/${uuid}`, method: 'GET' }),
  },
  EVENTS: {
    LIST: (filters: LogFilterState) => {
      const { page, limit, status, eventTypeUuid, search, sortField, sortOrder } = filters;
      let url = `/events?page=${page}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      if (eventTypeUuid) url += `&eventTypeUuid=${eventTypeUuid}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (sortField) url += `&sortField=${sortField}`;
      if (sortOrder) url += `&sortOrder=${sortOrder}`;
      return { url, method: 'GET' };
    },
    GET: (uuid: string) => ({ url: `/events/${uuid}`, method: 'GET' }),
  },
  SUBSCRIPTIONS: {
    LIST: { url: '/subscriptions', method: 'GET' },
    CREATE: { url: '/subscriptions', method: 'POST' },
    GET: (uuid: string) => ({ url: `/subscriptions/${uuid}`, method: 'GET' }),
    CANCEL: (uuid: string) => ({ url: `/subscriptions/${uuid}/cancel`, method: 'PATCH' }),
    TEST_URL: { url: '/subscriptions/test-url', method: 'POST' },
  },
};
