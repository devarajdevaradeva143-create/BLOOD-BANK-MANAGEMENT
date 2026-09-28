import { Router } from 'express';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  listBloodBanks,
  createBloodBank,
  updateBloodBank,
} from '../controllers/bloodbanks.controller.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin'),
  listBloodBanks
);
router.post('/', requireAuth, requireRole('SuperAdmin'), createBloodBank);
router.patch('/:id', requireAuth, requireRole('SuperAdmin'), updateBloodBank);

export default router;
