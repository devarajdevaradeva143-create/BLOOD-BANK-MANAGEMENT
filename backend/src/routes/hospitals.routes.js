import { Router } from 'express';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  donorForgotPasswordSchema,
  donorResetPasswordSchema,
  hospitalLoginSchema,
  hospitalRegisterSchema,
  hospitalUpdateSchema,
} from '../schemas/auth.schema.js';
import {
  registerHospital,
  loginHospital,
  refreshHospital,
  logoutHospital,
  meHospital,
  updateHospitalProfile,
  forgotHospitalPassword,
  resetHospitalPassword,
} from '../controllers/hospitals.controller.js';

const router = Router();

router.post('/register', authLimiter, validate(hospitalRegisterSchema), registerHospital);
router.post('/login', authLimiter, validate(hospitalLoginSchema), loginHospital);
router.post('/refresh', refreshHospital);
router.post('/logout', logoutHospital);
router.get('/me', requireAuth, meHospital);
router.patch('/me', requireAuth, validate(hospitalUpdateSchema), updateHospitalProfile);
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
