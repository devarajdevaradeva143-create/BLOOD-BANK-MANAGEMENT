import { Router } from 'express';
import { z } from 'zod';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { donorCreateSchema } from '../schemas/donor.schema.js';
import {
  donorForgotPasswordSchema,
  donorLoginSchema,
  donorResetPasswordSchema,
} from '../schemas/auth.schema.js';
import {
  createDonor,
  listDonors,
  listDonorMap,
  loginDonor,
  refreshDonor,
  logoutDonor,
  meDonor,
  forgotDonorPassword,
  resetDonorPassword,
} from '../controllers/donors.controller.js';

const donorCreateWithOtpSchema = donorCreateSchema.extend({
  code: z.string().length(6, 'code must be 6 characters'),
});

const router = Router();

router.post('/', validate(donorCreateWithOtpSchema), createDonor);
router.get('/map', requireAuth, listDonorMap);
router.get('/', requireAuth, listDonors);
// Donor session (real account: email + password -> JWT + refresh cookie).
router.post('/login', authLimiter, validate(donorLoginSchema), loginDonor);
router.post('/refresh', refreshDonor);
router.post('/logout', logoutDonor);
router.get('/me', requireAuth, meDonor);
// Secure donor password reset (generic responses, hashed OTP, cooldown).
router.post(
  '/forgot-password',
  authLimiter,
  validate(donorForgotPasswordSchema),
  forgotDonorPassword
);
router.post(
  '/reset-password',
  authLimiter,
  validate(donorResetPasswordSchema),
  resetDonorPassword
);

export default router;
