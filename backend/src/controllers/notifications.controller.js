import { asyncHandler } from '../middleware/asyncHandler.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { logAudit } from '../middleware/audit.js';

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20)
  );
  return { page, limit, skip: (page - 1) * limit };
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

function isUnreadOnly(v) {
  const s = String(v || '').trim().toLowerCase();
  return s === 'true' || s === '1';
}

// Ownership scope for non-admin roles. Donor JWT has no districtId and
// id = Donor._id; Hospital JWT has id = Hospital._id. Returns null for admins.
function ownerScope(req) {
  if (req.user?.role === 'Donor') {
    return { audience: 'donor', recipientId: String(req.user?.id || '') };
  }
  if (req.user?.role === 'Hospital') {
    return { audience: 'hospital', recipientId: String(req.user?.id || '') };
  }
  return null;
}

async function findNotificationByIdOrCode(id) {
  const key = String(id || '').trim();
  let doc = await Notification.findOne({ notificationId: key });
  if (!doc) {
    try {
      doc = await Notification.findById(key);
    } catch {
      doc = null;
    }
  }
  return doc;
}

/**
 * GET /api/notifications
 * Query: ?unreadOnly=&type=&districtId=&page=&limit= — sorted newest first.
 * DistrictAdmin: forced to own district (fail-closed 403 if missing).
 * SuperAdmin: may filter by ?districtId=, otherwise sees all.
 * Donor: forced {audience:'donor', recipientId:<donor _id>} (district params ignored).
 * Hospital: forced {audience:'hospital', recipientId:<hospital _id>} (district params ignored).
 */
export const listNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, type, districtId, district } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const scope = ownerScope(req);
  if (scope) {
    const filter = { ...scope };
    if (type) {
      filter.type = String(type).trim();
    }
    if (isUnreadOnly(unreadOnly)) {
      filter.read = false;
    }

    const [data, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
    ]);

    return res.status(200).json({
      data,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }

  const adminDistrict = await resolveAdminDistrict(req);
  if (req.user?.role === 'DistrictAdmin' && !adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }

  const filter = {};
  if (req.user?.role === 'DistrictAdmin') {
    filter.districtId = adminDistrict;
  } else if (districtId || district) {
    filter.districtId = String(districtId || district).trim().toLowerCase();
  }
  if (type) {
    filter.type = String(type).trim();
  }
  if (isUnreadOnly(unreadOnly)) {
    filter.read = false;
  }

  const [data, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
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
 * GET /api/notifications/unread-count → { unread }
 * Same scoping as list: Donor/Hospital forced to own audience+recipientId;
 * DistrictAdmin forced to own district; SuperAdmin may pass ?districtId= / ?type=.
 */
export const unreadCount = asyncHandler(async (req, res) => {
  const { type, districtId, district } = req.query;

  const scope = ownerScope(req);
  if (scope) {
    const filter = { ...scope, read: false };
    if (type) {
      filter.type = String(type).trim();
    }
    const unread = await Notification.countDocuments(filter);
    return res.status(200).json({ unread });
  }

  const adminDistrict = await resolveAdminDistrict(req);
  if (req.user?.role === 'DistrictAdmin' && !adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }

  const filter = { read: false };
  if (req.user?.role === 'DistrictAdmin') {
    filter.districtId = adminDistrict;
  } else if (districtId || district) {
    filter.districtId = String(districtId || district).trim().toLowerCase();
  }
  if (type) {
    filter.type = String(type).trim();
  }

  const unread = await Notification.countDocuments(filter);
  return res.status(200).json({ unread });
});

/**
 * PATCH /api/notifications/:id/read — mark one notification read.
 * DistrictAdmin: cross-district docs return 403.
 * Donor/Hospital: only own docs (audience+recipientId match) else 403.
 */
export const markRead = asyncHandler(async (req, res) => {
  const doc = await findNotificationByIdOrCode(req.params.id);
  if (!doc) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  const scope = ownerScope(req);
  if (scope) {
    if (
      String(doc.audience || '') !== scope.audience ||
      String(doc.recipientId || '') !== String(scope.recipientId || '')
    ) {
      return res.status(403).json({ message: 'Forbidden: notification belongs to another user' });
    }
  } else if (req.user?.role === 'DistrictAdmin') {
    const adminDistrict = await resolveAdminDistrict(req);
    if (!adminDistrict) {
      return res.status(403).json({ message: 'Forbidden: district not assigned' });
    }
    if (String(doc.districtId || '').trim().toLowerCase() !== adminDistrict) {
      return res
        .status(403)
        .json({ message: 'Forbidden: notification belongs to another district' });
    }
  }

  if (!doc.read) {
    doc.read = true;
    await doc.save();
  }

  logAudit(req.user?.id || null, 'notification.read', 'Notification', doc.notificationId, req, {});
  return res.status(200).json({ message: 'Notification marked read', data: doc });
});

/**
 * PATCH /api/notifications/read-all — mark all (filtered) notifications read.
 * DistrictAdmin: forced to own district. SuperAdmin: may pass ?districtId=.
 * Donor/Hospital: scoped to own audience+recipientId (district params ignored).
 */
export const markAllRead = asyncHandler(async (req, res) => {
  const { districtId, district } = req.query;

  const scope = ownerScope(req);
  if (scope) {
    const filter = { read: false, ...scope };
    const result = await Notification.updateMany(filter, { $set: { read: true } });

    logAudit(req.user?.id || null, 'notification.read_all', 'Notification', scope.recipientId || 'all', req, {
      matched: result.matchedCount ?? result.n,
    });
    return res.status(200).json({
      message: 'All notifications marked read',
      modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
      matchedCount: result.matchedCount ?? result.n ?? 0,
    });
  }

  const adminDistrict = await resolveAdminDistrict(req);
  if (req.user?.role === 'DistrictAdmin' && !adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }

  const filter = { read: false };
  if (req.user?.role === 'DistrictAdmin') {
    filter.districtId = adminDistrict;
  } else if (districtId || district) {
    filter.districtId = String(districtId || district).trim().toLowerCase();
  }

  const result = await Notification.updateMany(filter, { $set: { read: true } });

  logAudit(req.user?.id || null, 'notification.read_all', 'Notification', filter.districtId || 'all', req, {
    matched: result.matchedCount ?? result.n,
  });
  return res.status(200).json({
    message: 'All notifications marked read',
    modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
    matchedCount: result.matchedCount ?? result.n ?? 0,
  });
});

/**
 * DELETE /api/notifications/:id — delete one notification.
 * DistrictAdmin: cross-district docs return 403.
 * Donor/Hospital: only own docs (audience+recipientId match) else 403.
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const doc = await findNotificationByIdOrCode(req.params.id);
  if (!doc) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  const scope = ownerScope(req);
  if (scope) {
    if (
      String(doc.audience || '') !== scope.audience ||
      String(doc.recipientId || '') !== String(scope.recipientId || '')
    ) {
      return res.status(403).json({ message: 'Forbidden: notification belongs to another user' });
    }
  } else if (req.user?.role === 'DistrictAdmin') {
    const adminDistrict = await resolveAdminDistrict(req);
    if (!adminDistrict) {
      return res.status(403).json({ message: 'Forbidden: district not assigned' });
    }
    if (String(doc.districtId || '').trim().toLowerCase() !== adminDistrict) {
      return res
        .status(403)
        .json({ message: 'Forbidden: notification belongs to another district' });
    }
  }

  await doc.deleteOne();

  logAudit(req.user?.id || null, 'notification.delete', 'Notification', doc.notificationId, req, {});
  return res.status(200).json({ message: 'Notification deleted' });
});

export default { listNotifications, unreadCount, markRead, markAllRead, deleteNotification };
