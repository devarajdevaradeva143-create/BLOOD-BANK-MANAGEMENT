import { Router } from 'express';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import {
  donationCreateWithOtpSchema,
  donationStatusSchema,
} from '../schemas/donation.schema.js';
import {
  createDonation,
  listDonations,
  updateDonationStatus,
} from '../controllers/donations.controller.js';

const router = Router();

router.post('/', validate(donationCreateWithOtpSchema), createDonation);
router.get('/', requireAuth, listDonations);
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin'),
  validate(donationStatusSchema),
  updateDonationStatus
);

export default router;
