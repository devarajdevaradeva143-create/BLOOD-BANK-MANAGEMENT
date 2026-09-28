import { asyncHandler } from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import { hashPin } from '../utils/passwords.js';
import { logAudit } from '../middleware/audit.js';

const ADMIN_ROLES = ['DistrictAdmin', 'SuperAdmin'];

function toSafeAdmin(u) {
  if (!u) return null;
  return {
    id: String(u._id),
    staffId: u.staffId,
    name: u.name,
    role: u.role,
    designation: u.designation || null,
    email: u.email || '',
    phone: u.phone || '',
    districtId: u.districtId || '',
    active: u.active,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20)
  );
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * GET /api/admins (SuperAdmin only)
 * Query: ?role=&districtId=&search=&page=&limit=
 * Returns safe users (no pinHash / refreshTokens).
 */
export const listAdmins = asyncHandler(async (req, res) => {
  const { role, districtId, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (role) {
    filter.role = String(role).trim();
  }
  if (districtId) {
    filter.districtId = String(districtId).trim().toLowerCase();
  }
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { staffId: new RegExp(q, 'i') },
      { name: new RegExp(q, 'i') },
    ];
  }

  const [docs, total] = await Promise.all([
    User.find(filter)
      .select('-pinHash -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return res.status(200).json({
    data: docs.map(toSafeAdmin),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

/**
 * POST /api/admins (SuperAdmin only)
 * Body: { staffId, name, role, pin, districtId? }
 * 409 if staffId already exists.
 */
export const createAdmin = asyncHandler(async (req, res) => {
  const staffId = String(req.body?.staffId || '').trim().toUpperCase();
  const name = String(req.body?.name || '').trim();
  const role = String(req.body?.role || '').trim();
  const pin = String(req.body?.pin || '');
  const districtId = String(req.body?.districtId || '').trim().toLowerCase();

  if (!staffId || !name || !role || !pin) {
    return res
      .status(400)
      .json({ message: 'staffId, name, role and pin are required' });
  }
  if (!ADMIN_ROLES.includes(role)) {
    return res
      .status(400)
      .json({ message: `role must be one of: ${ADMIN_ROLES.join(', ')}` });
  }
  if (pin.length < 4) {
    return res
      .status(400)
      .json({ message: 'pin must be at least 4 characters' });
  }

  const existing = await User.findOne({ staffId });
  if (existing) {
    return res
      .status(409)
      .json({ message: 'An admin with this staffId already exists' });
  }

  const user = await User.create({
    staffId,
    name,
    role,
    districtId,
    pinHash: await hashPin(pin),
  });

  logAudit(req.user?.id || null, 'admin.create', 'User', String(user._id), req, {
    staffId,
    role,
  });

  return res
    .status(201)
    .json({ message: 'Admin created', user: toSafeAdmin(user) });
});

/**
 * PATCH /api/admins/:id (SuperAdmin only)
 * Body: { name?, districtId?, active? }
 */
export const updateAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  const { name, districtId, active } = req.body || {};

  if (name !== undefined) {
    const clean = String(name).trim();
    if (!clean) {
      return res.status(400).json({ message: 'name must not be empty' });
    }
    user.name = clean;
  }
  if (districtId !== undefined) {
    user.districtId = String(districtId || '').trim().toLowerCase();
  }
  if (active !== undefined) {
    if (typeof active !== 'boolean') {
      return res.status(400).json({ message: 'active must be a boolean' });
    }
    // A SuperAdmin must not lock themselves out.
    if (String(user._id) === String(req.user?.id) && active === false) {
      return res
        .status(400)
        .json({ message: 'You cannot deactivate your own account' });
    }
    user.active = active;
  }

  await user.save();
  logAudit(req.user?.id || null, 'admin.update', 'User', String(user._id), req);

  return res
    .status(200)
    .json({ message: 'Admin updated', user: toSafeAdmin(user) });
});

/**
 * POST /api/admins/:id/reset-pin (SuperAdmin only)
 * Body: { newPin }
 */
export const resetAdminPin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  const newPin = String(req.body?.newPin || '');
  if (!newPin) {
    return res.status(400).json({ message: 'newPin is required' });
  }
  if (newPin.length < 4) {
    return res
      .status(400)
      .json({ message: 'newPin must be at least 4 characters' });
  }

  user.pinHash = await hashPin(newPin);
  // Revoke all sessions — a PIN reset must log out other devices.
  user.refreshTokens = [];
  await user.save();

  logAudit(
    req.user?.id || null,
    'admin.reset_pin',
    'User',
    String(user._id),
    req
  );

  return res
    .status(200)
    .json({ message: 'PIN reset successful', user: toSafeAdmin(user) });
});

export default { listAdmins, createAdmin, updateAdmin, resetAdminPin };
