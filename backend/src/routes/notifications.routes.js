import { Router } from 'express';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  deleteNotification,
  listNotifications,
  markRead,
  markAllRead,
  unreadCount,
} from '../controllers/notifications.controller.js';

const router = Router();

const ALL_ROLES = ['DistrictAdmin', 'SuperAdmin', 'Donor', 'Hospital'];

router.get('/', requireAuth, requireRole(ALL_ROLES), listNotifications);
// Static routes before `/:id/read` — order matters.
router.get(
  '/unread-count',
  requireAuth,
  requireRole(ALL_ROLES),
  unreadCount
);
router.patch(
  '/read-all',
  requireAuth,
  requireRole(ALL_ROLES),
  markAllRead
);
router.patch(
  '/:id/read',
  requireAuth,
  requireRole(ALL_ROLES),
  markRead
);
router.delete(
  '/:id',
  requireAuth,
  requireRole(ALL_ROLES),
  deleteNotification
);

export default router;
