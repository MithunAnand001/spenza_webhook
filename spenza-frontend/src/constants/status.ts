export const WebhookEventStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETRYING: 'retrying',
} as const;

export type WebhookEventStatus = (typeof WebhookEventStatus)[keyof typeof WebhookEventStatus];

export const SubscriptionStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
