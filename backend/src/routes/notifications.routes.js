import { Router } from 'express';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  listNotifications,
  markRead,
  markAllRead,
} from '../controllers/notifications.controller.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin'),
  listNotifications
);
// Static route before `/:id/read` for clarity.
router.patch(
  '/read-all',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin'),
  markAllRead
);
router.patch(
  '/:id/read',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin'),
  markRead
);

export default router;
