import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  donorForgotPasswordSchema,
  donorResetPasswordSchema,
} from '../schemas/auth.schema.js';
import {
  forgotHospitalPassword,
  resetHospitalPassword,
} from '../controllers/hospitals.controller.js';

const router = Router();

// Secure hospital password reset (generic responses, hashed OTP, cooldown).
// Schemas are shared with donor reset: { email } and
// { email, code, newPassword (strong) }.
router.post(
  '/forgot-password',
  authLimiter,
  validate(donorForgotPasswordSchema),
  forgotHospitalPassword
);
router.post(
  '/reset-password',
  authLimiter,
  validate(donorResetPasswordSchema),
  resetHospitalPassword
);

export default router;
