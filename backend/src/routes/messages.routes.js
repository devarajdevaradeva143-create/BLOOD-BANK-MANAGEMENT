import { Router } from 'express';
import { authRequired as requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { messageCreateSchema, messageReplySchema } from '../schemas/message.schema.js';
import {
  createMessage,
  listMessages,
  markMessageRead,
  replyMessage,
} from '../controllers/messages.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole('DistrictAdmin'),
  validate(messageCreateSchema),
  createMessage
);
router.get(
  '/',
  requireAuth,
  requireRole('DistrictAdmin', 'SuperAdmin'),
  listMessages
);
router.patch(
  '/:id/read',
  requireAuth,
  requireRole('SuperAdmin'),
  markMessageRead
);
router.post(
  '/:id/reply',
  requireAuth,
  requireRole('SuperAdmin'),
  validate(messageReplySchema),
  replyMessage
);

export default router;
