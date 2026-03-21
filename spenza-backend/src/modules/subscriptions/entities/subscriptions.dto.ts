import { z } from 'zod';

const xssPattern = /<script|<\/script|on\w+\s*=/i;
const xssCheck = (val: string | undefined) => !val || !xssPattern.test(val);

export const CreateSubscriptionSchema = z.object({
  eventTypeUuid: z.string().uuid(),
  callbackUrl: z.string().url('Must be a valid URL').refine(xssCheck, { message: 'Potential XSS detected' }),
  authenticationType: z.enum(['none', 'basic', 'bearer', 'hmac']).optional(),
});

export type CreateSubscriptionDto = z.infer<typeof CreateSubscriptionSchema>;
