import { Router } from 'express';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  listAdmins,
  createAdmin,
  updateAdmin,
  resetAdminPin,
} from '../controllers/admins.controller.js';

const router = Router();

// All admin-management routes are SuperAdmin only.
router.use(requireAuth, requireRole('SuperAdmin'));

router.get('/', listAdmins);
router.post('/', createAdmin);
router.patch('/:id', updateAdmin);
router.post('/:id/reset-pin', resetAdminPin);

export default router;
