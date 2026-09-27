import { z } from 'zod';

const mobileRegex = /^\d{10}$/;
const purposeEnum = z.enum(['donor', 'request', 'donation']);

export const otpRequestSchema = z.object({
  mobile: z.string().regex(mobileRegex, 'Invalid Indian mobile number'),
  purpose: purposeEnum,
});

export const otpVerifySchema = z.object({
  mobile: z.string().regex(mobileRegex, 'Invalid Indian mobile number'),
  code: z.string().length(6, 'code must be 6 characters'),
  purpose: purposeEnum,
});
