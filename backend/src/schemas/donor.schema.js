import { z } from 'zod';
import { strongPassword } from './auth.schema.js';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const genderSchema = z.preprocess(
  (v) => {
    const s = String(v || '').trim().toLowerCase();
    if (!s) return v;
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
  z.enum(['Male', 'Female', 'Other', 'Transgender'])
);

export const donorCreateSchema = z.object({
  fullName: z.string().min(3, 'fullName must be at least 3 chars'),
  dob: z.string().min(1, 'dob is required'),
  age: z.number().min(18).max(65).optional(),
  gender: genderSchema,
  bloodGroup: z.enum(BLOOD_GROUPS),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  email: z.string().email('Invalid email').toLowerCase(),
  // Real-website auth: donors register with a strong password and sign in
  // with it (hashed server-side, never stored in plain text).
  password: strongPassword,
  district: z.string().min(1, 'district is required'),
  districtId: z.string().min(1).optional(),
  city: z.string().min(1, 'city is required').optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode').optional(),
  address: z.string().min(10, 'address must be at least 10 chars').optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  eligibility: z.record(z.string(), z.any()).optional(),
  consents: z.record(z.string(), z.any()).optional(),
  status: z.enum(['Registered', 'Deferred', 'Donated']).optional(),
});
