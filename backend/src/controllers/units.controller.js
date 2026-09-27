import { asyncHandler } from '../middleware/asyncHandler.js';
import BloodUnit from '../models/BloodUnit.js';
import { genUnitCode } from '../utils/ids.js';
import { logAudit } from '../middleware/audit.js';

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20)
  );
  return { page, limit, skip: (page - 1) * limit };
}

async function findUnitByIdOrCode(id) {
  const key = String(id || '').trim();
  let unit = await BloodUnit.findOne({ unitCode: key });
  if (!unit) {
    try {
      unit = await BloodUnit.findById(key);
    } catch {
      unit = null;
    }
  }
  return unit;
}

function actor(req) {
  return req.user?.id || req.user?.staffId || null;
}

/**
 * GET /api/units (auth required at route level)
 * Query: ?bloodGroup=&district=&status=&component=&search=&page=&limit=
 */
export const listUnits = asyncHandler(async (req, res) => {
  const { bloodGroup, district, status, component, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (district) filter.district = new RegExp(`^${String(district).trim()}$`, 'i');
  if (status) filter.status = status;
  if (component) filter.component = component;
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { unitCode: new RegExp(q, 'i') },
      { storageLocation: new RegExp(q, 'i') },
      { collectionStaff: new RegExp(q, 'i') },
    ];
  }

  const [data, total] = await Promise.all([
    BloodUnit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BloodUnit.countDocuments(filter),
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
 * POST /api/units (auth DistrictAdmin/SuperAdmin at route level)
 * Defaults: status UnderTesting, testStatus Pending, history `registered`.
 */
export const createUnit = asyncHandler(async (req, res) => {
  const unit = await BloodUnit.create({
    ...req.body,
    unitCode: req.body.unitCode || genUnitCode(),
    status: req.body.status || 'UnderTesting',
    testStatus: req.body.testStatus || 'Pending',
    history: [
      {
        type: 'registered',
        at: new Date(),
        byUser: actor(req),
        status: req.body.status || 'UnderTesting',
        note: 'Unit registered',
      },
    ],
  });

  logAudit(actor(req), 'unit.create', 'BloodUnit', unit.unitCode, req, {
    bloodGroup: unit.bloodGroup,
    component: unit.component,
  });

  return res.status(201).json({ message: 'Unit registered', unit });
});

/**
 * PATCH /api/units/:id/status (auth at route level)
 * Body: { status } — validated by unitStatusSchema.
 */
export const updateUnitStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const unit = await findUnitByIdOrCode(id);
  if (!unit) {
    return res.status(404).json({ message: 'Unit not found' });
  }

  const from = unit.status;
  unit.status = status;
  unit.history.push({
    type: 'statusUpdated',
    at: new Date(),
    byUser: actor(req),
    status,
    note: note || `Status ${from} -> ${status}`,
  });
  await unit.save();

  logAudit(actor(req), 'unit.status', 'BloodUnit', unit.unitCode, req, {
    from,
    to: status,
  });

  return res.status(200).json({ message: 'Unit status updated', unit });
});

/**
 * POST /api/units/:id/test (DistrictAdmin/SuperAdmin at route level)
 * Body: { testStatus, screeningResult, testedBy, testDate, remarks }
 * Auto status: Passed -> Available, Failed -> Discarded.
 */
export const recordTestResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { testStatus, screeningResult, testedBy, testDate, remarks } = req.body;

  const unit = await findUnitByIdOrCode(id);
  if (!unit) {
    return res.status(404).json({ message: 'Unit not found' });
  }

  unit.testStatus = testStatus;
  if (screeningResult !== undefined) unit.screeningResult = screeningResult;
  if (testedBy !== undefined) unit.testedBy = testedBy;
  if (testDate !== undefined) unit.testDate = testDate ? new Date(testDate) : unit.testDate;
  if (remarks !== undefined) unit.remarks = remarks;

  if (testStatus === 'Passed') {
    unit.status = 'Available';
  } else if (testStatus === 'Failed') {
    unit.status = 'Discarded';
  }

  unit.history.push({
    type: 'testCompleted',
    at: new Date(),
    byUser: actor(req) || testedBy || null,
    status: unit.status,
    note: `Test ${testStatus}${remarks ? `: ${remarks}` : ''}`,
  });
  await unit.save();

  logAudit(actor(req), 'unit.test', 'BloodUnit', unit.unitCode, req, {
    testStatus,
    status: unit.status,
  });

  return res.status(200).json({ message: 'Test result recorded', unit });
});

export default { listUnits, createUnit, updateUnitStatus, recordTestResult };
