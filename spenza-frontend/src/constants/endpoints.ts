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
    LIST: (page = 1, limit = 20) => ({ url: `/events?page=${page}&limit=${limit}`, method: 'GET' }),
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
