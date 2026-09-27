import { z } from 'zod';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const donationCreateSchema = z.object({
  donorName: z.string().min(3, 'donorName must be at least 3 chars'),
  bloodGroup: z.enum(BLOOD_GROUPS),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  districtId: z.string().min(1, 'districtId is required'),
  district: z.string().optional(),
  availableDate: z.string().min(1, 'availableDate is required'),
  city: z.string().optional(),
  pincode: z.string().optional(),
  address: z.string().optional(),
  preferredTime: z.string().optional(),
  hospitalId: z.string().optional(),
  campId: z.string().optional(),
  notes: z.string().optional(),
});

export const donationCreateWithOtpSchema = donationCreateSchema.extend({
  code: z.string().length(6, 'code must be 6 characters'),
});

export const donationStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'completed', 'cancelled']),
});
