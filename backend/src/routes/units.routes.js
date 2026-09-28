import { Router } from 'express';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import {
  unitCreateSchema,
  unitStatusSchema,
  testResultSchema,
} from '../schemas/unit.schema.js';
import {
  listUnits,
  unitsSummary,
  createUnit,
  updateUnitStatus,
  recordTestResult,
} from '../controllers/units.controller.js';

const router = Router();

router.get('/', requireAuth, listUnits);
router.get('/summary', requireAuth, unitsSummary);
router.post(
  '/',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin'),
  validate(unitCreateSchema),
  createUnit
);
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin'),
  validate(unitStatusSchema),
  updateUnitStatus
);
router.post(
  '/:id/test',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin'),
  validate(testResultSchema),
  recordTestResult
);

export default router;
