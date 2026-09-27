import { Router } from 'express';
import { z } from 'zod';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import {
  requestCreateSchema,
  bulkRequestSchema,
  requestStatusSchema,
} from '../schemas/request.schema.js';
import {
  createRequest,
  createBulkRequests,
  listRequests,
  updateRequestStatus,
} from '../controllers/requests.controller.js';

const requestCreateWithOtpSchema = requestCreateSchema.extend({
  code: z.string().length(6, 'code must be 6 characters'),
});

const router = Router();

router.post('/', validate(requestCreateWithOtpSchema), createRequest);
router.post(
  '/bulk',
  requireAuth,
  requireRole('Hospital'),
  validate(bulkRequestSchema),
  createBulkRequests
);
router.get('/', requireAuth, listRequests);
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin', 'Hospital'),
  validate(requestStatusSchema),
  updateRequestStatus
);

export default router;
