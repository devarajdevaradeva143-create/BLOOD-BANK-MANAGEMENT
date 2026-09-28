import { Router } from 'express';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { getStats, getDistrictStats } from '../controllers/stats.controller.js';

const router = Router();

// Public: GET /api/stats
router.get('/', getStats);

// District-scoped: GET /api/stats/district (must be before any /:id routes)
router.get(
  '/district',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin'),
  getDistrictStats
);

export default router;
