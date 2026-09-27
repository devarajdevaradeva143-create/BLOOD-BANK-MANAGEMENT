import { Router } from 'express';
import { z } from 'zod';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { donorCreateSchema } from '../schemas/donor.schema.js';
import {
  donorForgotPasswordSchema,
  donorResetPasswordSchema,
} from '../schemas/auth.schema.js';
import {
  createDonor,
  listDonors,
  forgotDonorPassword,
  resetDonorPassword,
} from '../controllers/donors.controller.js';

const donorCreateWithOtpSchema = donorCreateSchema.extend({
  code: z.string().length(6, 'code must be 6 characters'),
});

const router = Router();

router.post('/', validate(donorCreateWithOtpSchema), createDonor);
router.get('/', requireAuth, listDonors);
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
