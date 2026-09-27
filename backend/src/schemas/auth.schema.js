import { z } from 'zod';

export const loginSchema = z.object({
  staffId: z.string().min(1, 'staffId is required'),
  pin: z.string().min(4, 'pin must be at least 4 chars').max(10, 'pin must be at most 10 chars'),
});

// Staff/Doctor PIN reset — identifier is staffId (no email on User model).
export const forgotPasswordSchema = z.object({
  staffId: z.string().min(1, 'staffId is required'),
});

export const resetPasswordSchema = z.object({
  staffId: z.string().min(1, 'staffId is required'),
  code: z.string().length(6, 'code must be 6 characters'),
  newPin: z
    .string()
    .min(4, 'pin must be at least 4 chars')
    .max(10, 'pin must be at most 10 chars'),
});

// Donor password reset — identifier is email (Donor.email, lowercase).
const strongPassword = z
  .string()
  .min(8, 'password must be at least 8 characters')
  .regex(/[A-Z]/, 'password must contain an uppercase letter')
  .regex(/[a-z]/, 'password must contain a lowercase letter')
  .regex(/[0-9]/, 'password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'password must contain a special character');

export const donorForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email').toLowerCase(),
});

export const donorResetPasswordSchema = z.object({
  email: z.string().email('Invalid email').toLowerCase(),
  code: z.string().length(6, 'code must be 6 characters'),
  newPassword: strongPassword,
});
