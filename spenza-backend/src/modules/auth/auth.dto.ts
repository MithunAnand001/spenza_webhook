import { z } from 'zod';

const xssPattern = /<script|<\/script|on\w+\s*=/i;
const xssCheck = (val: string | undefined) => !val || !xssPattern.test(val);

export const RegisterSchema = z.object({
  name: z.string().min(2).max(255).refine(xssCheck, { message: 'Potential XSS detected' }),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phoneNumber: z.string().optional().refine(xssCheck, { message: 'Potential XSS detected' }),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;