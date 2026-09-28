import { Router } from 'express';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { getStats, getDistrictStats, getDistrictsOverview, getReports } from '../controllers/stats.controller.js';

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

// All-districts overview: GET /api/stats/districts
router.get(
  '/districts',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin'),
  getDistrictsOverview
);

// Reports: GET /api/stats/reports?period=7d|30d|all&districtId=
router.get(
  '/reports',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin'),
  getReports
);

export default router;
