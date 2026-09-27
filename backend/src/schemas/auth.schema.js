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

// Hospital auth — email + password model (Blood-request-frontend).
export const hospitalRegisterSchema = z.object({
  hospitalName: z.string().min(2, 'hospitalName must be at least 2 chars'),
  registrationNumber: z.string().min(1, 'registrationNumber is required'),
  hospitalId: z.string().optional().default(''),
  hospitalType: z.enum(['Government', 'Private', 'Trust', 'Other']).optional().default('Private'),
  email: z.string().email('Invalid email').toLowerCase(),
  phone: z.string().regex(/^\d{10}$/, 'phone must be 10 digits'),
  emergencyContact: z.string().regex(/^\d{10}$/, 'emergencyContact must be 10 digits').optional().or(z.literal('')),
  district: z.string().optional().default(''),
  districtId: z.string().optional().default(''),
  address: z.string().min(5, 'hospitalAddress must be at least 5 chars'),
  pincode: z.string().regex(/^\d{6}$/, 'pincode must be 6 digits').optional().or(z.literal('')),
  website: z.string().optional().default(''),
  officerName: z.string().optional().default(''),
  officerDesignation: z.string().optional().default(''),
  officerContact: z.string().optional().default(''),
  password: strongPassword,
});

export const hospitalLoginSchema = z.object({
  email: z.string().email('Invalid email').toLowerCase(),
  password: z.string().min(1, 'password is required'),
});

// PATCH /api/hospitals/me — identity fields (email/registrationNumber)
// are immutable; everything else is optional.
export const hospitalUpdateSchema = z.object({
  hospitalName: z.string().min(2).optional(),
  hospitalId: z.string().optional(),
  hospitalType: z.enum(['Government', 'Private', 'Trust', 'Other']).optional(),
  phone: z.string().regex(/^\d{10}$/, 'phone must be 10 digits').optional().or(z.literal('')),
  emergencyContact: z.string().regex(/^\d{10}$/, 'emergencyContact must be 10 digits').optional().or(z.literal('')),
  district: z.string().optional(),
  districtId: z.string().optional(),
  address: z.string().min(5).optional(),
  pincode: z.string().regex(/^\d{6}$/, 'pincode must be 6 digits').optional().or(z.literal('')),
  website: z.string().optional(),
  officerName: z.string().optional(),
  officerDesignation: z.string().optional(),
  officerContact: z.string().optional(),
  logo: z.string().max(500000, 'logo is too large').optional(),
});
