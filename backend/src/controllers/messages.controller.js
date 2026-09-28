import { asyncHandler } from '../middleware/asyncHandler.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { genMessageId } from '../utils/ids.js';
import { logAudit } from '../middleware/audit.js';

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20)
  );
  return { page, limit, skip: (page - 1) * limit };
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveAdminDistrict(req) {
  let d = String(req.user?.districtId || '').trim().toLowerCase();
  if (!d && req.user?.id && req.user?.role !== 'Hospital') {
    try {
      const me = await User.findById(req.user.id).select('districtId').lean();
      d = String(me?.districtId || '').trim().toLowerCase();
    } catch {
      d = '';
    }
  }
  return d;
}

/**
 * POST /api/messages (DistrictAdmin — SuperAdmin-ku message anuppu)
 * Body: { subject, body }. from/to server-side fix pannuvom.
 */
export const createMessage = asyncHandler(async (req, res) => {
  if (req.user?.role !== 'DistrictAdmin') {
    return res.status(403).json({ message: 'Only DistrictAdmins can send messages' });
  }
  const adminDistrict = await resolveAdminDistrict(req);
  if (!adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }
  const me = await User.findById(req.user.id).select('name').lean().catch(() => null);
  const doc = await Message.create({
    messageId: genMessageId(),
    fromId: String(req.user.id),
    fromName: me?.name || req.user?.name || '',
    fromRole: 'DistrictAdmin',
    fromDistrictId: adminDistrict,
    toRole: 'SuperAdmin',
    subject: String(req.body.subject || '').trim(),
    body: String(req.body.body || '').trim(),
    status: 'unread',
  });
  logAudit(String(req.user.id), 'message.create', 'Message', doc.messageId, req, {
    district: adminDistrict,
  });
  return res.status(201).json({ message: 'Message sent', data: doc });
});

/**
 * GET /api/messages
 * DistrictAdmin: thanoda messages mattum. SuperAdmin: ellam + filters.
 */
export const listMessages = asyncHandler(async (req, res) => {
  const { districtId, district, status, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};

  if (req.user?.role === 'DistrictAdmin') {
    const adminDistrict = await resolveAdminDistrict(req);
    if (!adminDistrict) {
      return res.status(403).json({ message: 'Forbidden: district not assigned' });
    }
    filter.fromId = String(req.user.id);
  } else if (req.user?.role === 'SuperAdmin') {
    const d = String(districtId || district || '').trim().toLowerCase();
    if (d) filter.fromDistrictId = d;
    if (status) filter.status = status;
  } else {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }

  if (search) {
    const q = escapeRegex(String(search).trim());
    filter.$or = [
      { subject: new RegExp(q, 'i') },
      { body: new RegExp(q, 'i') },
      { messageId: new RegExp(q, 'i') },
      { fromName: new RegExp(q, 'i') },
    ];
  }

  const [data, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Message.countDocuments(filter),
  ]);
  return res.status(200).json({
    data,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

/**
 * PATCH /api/messages/:id/read (SuperAdmin — padichachu mark)
 */
export const markMessageRead = asyncHandler(async (req, res) => {
  if (req.user?.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  const doc = await Message.findOne({
    messageId: String(req.params.id || '').trim(),
  });
  if (!doc) {
    return res.status(404).json({ message: 'Message not found' });
  }
  if (doc.status === 'unread') {
    doc.status = 'read';
    await doc.save();
  }
  return res.status(200).json({ message: 'Message marked read', data: doc });
});

/**
 * POST /api/messages/:id/reply (SuperAdmin — badhil anuppu)
 * Body: { reply }. status -> replied.
 */
export const replyMessage = asyncHandler(async (req, res) => {
  if (req.user?.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  const doc = await Message.findOne({
    messageId: String(req.params.id || '').trim(),
  });
  if (!doc) {
    return res.status(404).json({ message: 'Message not found' });
  }
  doc.reply = String(req.body.reply || '').trim();
  doc.repliedBy = String(req.user?.id || '');
  doc.repliedAt = new Date();
  doc.status = 'replied';
  await doc.save();
  logAudit(String(req.user.id), 'message.reply', 'Message', doc.messageId, req, {});
  return res.status(200).json({ message: 'Reply sent', data: doc });
});

export default { createMessage, listMessages, markMessageRead, replyMessage };
