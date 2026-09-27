import { z } from 'zod';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const genderSchema = z.preprocess(
  (v) => {
    const s = String(v || '').trim().toLowerCase();
    if (!s) return v;
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
  z.enum(['Male', 'Female', 'Other', 'Transgender'])
);

export const requestCreateSchema = z.object({
  patientName: z.string().min(3, 'patientName must be at least 3 chars'),
  patientAge: z.number().min(0).max(120),
  gender: genderSchema,
  bloodGroup: z.enum(BLOOD_GROUPS),
  units: z.number().int().min(1).max(50),
  requiredDate: z.string().min(1, 'requiredDate is required'),
  reason: z.string().min(3, 'reason must be at least 3 chars'),
  districtId: z.string().min(1, 'districtId is required'),
  hospitalName: z.string().min(1, 'hospitalName is required'),
  hospitalAddress: z.string().min(5, 'hospitalAddress must be at least 5 chars'),
  contact: z.string().regex(/^\d{10}$/, 'contact must be 10 digits'),
  requestType: z.enum(['emergency', 'normal']),
});

export const requestStatusSchema = z.object({
  status: z.enum(['submitted', 'approved', 'fulfilled', 'cancelled']),
});

// --- Bulk (multi-patient) hospital submission ---------------------------
// POST /api/requests/bulk — authenticated (Hospital role) + OTP-gated.
// One BloodRequest document is created per patient, all sharing a groupId.

const bulkPatientSchema = z.object({
  name: z.string().min(2, 'patient name must be at least 2 chars'),
  age: z.number().min(0).max(120),
  gender: genderSchema,
  bloodGroup: z.enum(BLOOD_GROUPS),
  component: z.string().min(1, 'component is required'),
  units: z.number().int().min(1).max(50),
  ward: z.string().min(1, 'ward is required'),
  diagnosis: z.string().min(1, 'diagnosis is required'),
});

const doctorSchema = z.object({
  name: z.string().min(1, 'doctor name is required'),
  id: z.string().min(1, 'doctor ID is required'),
  department: z.string().min(1, 'department is required'),
  contact: z.string().regex(/^\d{10}$/, 'doctor contact must be 10 digits'),
});

export const bulkRequestSchema = z.object({
  // Frontend categories; normalized to emergency|normal server-side.
  requestType: z.enum(['emergency', 'routine', 'surgery', 'icu']),
  priority: z.enum(['critical', 'high', 'normal']).default('normal'),
  districtId: z.string().min(1, 'districtId is required'),
  requiredDate: z.string().min(1, 'requiredDate is required'),
  requiredTime: z.string().optional().default(''),
  hospitalName: z.string().min(1, 'hospitalName is required'),
  hospitalAddress: z.string().min(5, 'hospitalAddress must be at least 5 chars'),
  // OTP target — hospital/doctor contact number (purpose 'request').
  contact: z.string().regex(/^\d{10}$/, 'contact must be 10 digits'),
  code: z.string().length(6, 'code must be 6 characters'),
  doctor: doctorSchema,
  patients: z.array(bulkPatientSchema).min(1, 'at least one patient is required').max(20, 'at most 20 patients per request'),
});
