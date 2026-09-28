import { asyncHandler } from '../middleware/asyncHandler.js';
import Donor from '../models/Donor.js';
import Donation from '../models/Donation.js';
import BloodRequest from '../models/BloodRequest.js';
import BloodUnit from '../models/BloodUnit.js';
import Hospital from '../models/Hospital.js';
import BloodBank from '../models/BloodBank.js';
import User from '../models/User.js';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// The 38 Tamil Nadu districts — display names matching the frontend
// DISTRICTS list. districtId slugs are the lowercase form.
const TN_DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kancheepuram',
  'Karur',
  'Krishnagiri',
  'Kanyakumari',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar',
];

function districtSlug(name) {
  return String(name || '').trim().toLowerCase();
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

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/stats (public)
 * Live counters for the donor/request homepages.
 * No auth — aggregates only, no personal data.
 */
export const getStats = asyncHandler(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [donors, requests, fulfilledAgg, availableAgg] = await Promise.all([
    Donor.countDocuments(),
    BloodRequest.countDocuments(),
    BloodRequest.aggregate([
      { $match: { status: 'fulfilled' } },
      { $group: { _id: null, units: { $sum: '$units' } } },
    ]),
    BloodUnit.aggregate([
      {
        $match: {
          status: 'Available',
          testStatus: 'Passed',
          expiryDate: { $gte: today },
        },
      },
      { $group: { _id: null, units: { $sum: '$quantity' } } },
    ]),
  ]);

  const fulfilledUnits = fulfilledAgg[0]?.units || 0;
  const availableUnits = availableAgg[0]?.units || 0;

  return res.status(200).json({
    donors,
    requests,
    fulfilledUnits,
    // One donation can help up to three patients.
    livesSupported: fulfilledUnits * 3,
    availableUnits,
  });
});

/**
 * GET /api/stats/district (DistrictAdmin/SuperAdmin at route level)
 * District-scoped counters: { district, donors, requests, fulfilledUnits,
 *   availableUnits, hospitals }.
 * DistrictAdmin is forced to own district (fail-closed 403 if missing);
 * SuperAdmin may pass ?districtId= (or ?district=).
 */
export const getDistrictStats = asyncHandler(async (req, res) => {
  let adminDistrict = String(req.user?.districtId || '').trim().toLowerCase();
  if (!adminDistrict && req.user?.id && req.user?.role !== 'Hospital') {
    try {
      const me = await User.findById(req.user.id).select('districtId').lean();
      adminDistrict = String(me?.districtId || '').trim().toLowerCase();
    } catch {
      adminDistrict = '';
    }
  }

  if (req.user?.role === 'DistrictAdmin' && !adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }

  let district = '';
  if (req.user?.role === 'DistrictAdmin') {
    district = adminDistrict;
  } else {
    const q = req.query.districtId || req.query.district || adminDistrict;
    district = String(q || '').trim().toLowerCase();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const idFilter = district ? { districtId: district } : {};
  const unitMatch = {
    status: 'Available',
    testStatus: 'Passed',
    expiryDate: { $gte: today },
    ...(district
      ? { district: new RegExp(`^${escapeRegExp(district)}$`, 'i') }
      : {}),
  };

  const [donors, requests, fulfilledAgg, availableAgg, hospitals] =
    await Promise.all([
      Donor.countDocuments(idFilter),
      BloodRequest.countDocuments(idFilter),
      BloodRequest.aggregate([
        { $match: { ...idFilter, status: 'fulfilled' } },
        { $group: { _id: null, units: { $sum: '$units' } } },
      ]),
      BloodUnit.aggregate([
        { $match: unitMatch },
        { $group: { _id: null, units: { $sum: '$quantity' } } },
      ]),
      Hospital.countDocuments(idFilter),
    ]);

  return res.status(200).json({
    district,
    donors,
    requests,
    fulfilledUnits: fulfilledAgg[0]?.units || 0,
    availableUnits: availableAgg[0]?.units || 0,
    hospitals,
  });
});

/**
 * GET /api/stats/districts (SuperAdmin/DistrictAdmin at route level)
 * One row per TN district: { district, districtId, hospitals, banks,
 *   donors, requests, stock }.
 * Fast: 5 grouped aggregates in one Promise.all (no per-district queries).
 * Stock = available + passed + unexpired units quantity (BloodUnit has no
 * districtId, so it is grouped by lowercased `district` text).
 */
export const getDistrictsOverview = asyncHandler(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [donorRows, requestRows, hospitalRows, bankRows, stockRows] =
    await Promise.all([
      Donor.aggregate([
        { $group: { _id: '$districtId', count: { $sum: 1 } } },
      ]),
      BloodRequest.aggregate([
        { $group: { _id: '$districtId', count: { $sum: 1 } } },
      ]),
      Hospital.aggregate([
        { $group: { _id: '$districtId', count: { $sum: 1 } } },
      ]),
      BloodBank.aggregate([
        { $group: { _id: '$districtId', count: { $sum: 1 } } },
      ]),
      BloodUnit.aggregate([
        {
          $match: {
            status: 'Available',
            testStatus: 'Passed',
            expiryDate: { $gte: today },
          },
        },
        {
          $group: {
            _id: { $toLower: { $trim: { input: '$district' } } },
            stock: { $sum: { $ifNull: ['$quantity', 1] } },
          },
        },
      ]),
    ]);

  const toCountMap = (rows) => {
    const m = {};
    for (const r of rows) {
      const k = String(r?._id ?? '').trim().toLowerCase();
      if (k) m[k] = r.count || 0;
    }
    return m;
  };
  const donorsMap = toCountMap(donorRows);
  const requestsMap = toCountMap(requestRows);
  const hospitalsMap = toCountMap(hospitalRows);
  const banksMap = toCountMap(bankRows);
  const stockMap = {};
  for (const r of stockRows) {
    const k = String(r?._id ?? '').trim().toLowerCase();
    if (k) stockMap[k] = r.stock || 0;
  }

  const data = TN_DISTRICTS.map((district) => {
    const districtId = districtSlug(district);
    return {
      district,
      districtId,
      hospitals: hospitalsMap[districtId] || 0,
      banks: banksMap[districtId] || 0,
      donors: donorsMap[districtId] || 0,
      requests: requestsMap[districtId] || 0,
      stock: stockMap[districtId] || 0,
    };
  });

  return res.status(200).json({ data, total: data.length });
});

function parsePeriodDays(period) {
  if (period === '7d') return 7;
  if (period === '30d') return 30;
  return null;
}

/**
 * GET /api/stats/reports?period=7d|30d|all&districtId=
 * (SuperAdmin/DistrictAdmin at route level)
 * DistrictAdmin is forced to own district (fail-closed 403 if missing);
 * SuperAdmin may pass ?districtId=.
 * Period filters date-bound metrics (collections, issues, donors,
 * fulfilment) by createdAt; stock/testing/expiry are current snapshots.
 */
export const getReports = asyncHandler(async (req, res) => {
  const adminDistrict = await resolveAdminDistrict(req);
  if (req.user?.role === 'DistrictAdmin' && !adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }

  let district = '';
  if (req.user?.role === 'DistrictAdmin') {
    district = adminDistrict;
  } else {
    district = String(req.query.districtId || '').trim().toLowerCase();
  }

  const period = String(req.query.period || 'all');
  const days = parsePeriodDays(period);
  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
  const dateFilter = since ? { createdAt: { $gte: since } } : {};

  const idFilter = {
    ...(district ? { districtId: district } : {}),
    ...dateFilter,
  };
  // BloodUnit stores district display text (no districtId) — exact,
  // case-insensitive match like the units controller.
  const unitScope = district
    ? { district: new RegExp(`^${escapeRegExp(district)}$`, 'i') }
    : {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30d = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    collections,
    fulfilledCount,
    fulfilledAgg,
    totalRequests,
    newDonors,
    stockAgg,
    testAgg,
    expired,
    expiringSoon,
  ] = await Promise.all([
    Donation.countDocuments({ ...idFilter, status: 'completed' }),
    BloodRequest.countDocuments({ ...idFilter, status: 'fulfilled' }),
    BloodRequest.aggregate([
      { $match: { ...idFilter, status: 'fulfilled' } },
      { $group: { _id: null, units: { $sum: '$units' } } },
    ]),
    BloodRequest.countDocuments(idFilter),
    Donor.countDocuments(idFilter),
    BloodUnit.aggregate([
      { $match: { ...unitScope, status: 'Available' } },
      {
        $group: {
          _id: '$bloodGroup',
          quantity: { $sum: { $ifNull: ['$quantity', 1] } },
        },
      },
    ]),
    BloodUnit.aggregate([
      { $match: unitScope },
      { $group: { _id: '$testStatus', count: { $sum: 1 } } },
    ]),
    BloodUnit.countDocuments({ ...unitScope, expiryDate: { $lt: today } }),
    BloodUnit.countDocuments({
      ...unitScope,
      expiryDate: { $gte: today, $lte: in30d },
    }),
  ]);

  const stockByGroup = {};
  for (const g of BLOOD_GROUPS) stockByGroup[g] = 0;
  for (const r of stockAgg) {
    if (r._id && stockByGroup[r._id] !== undefined) {
      stockByGroup[r._id] = r.quantity || 0;
    }
  }

  const testing = { pending: 0, passed: 0, failed: 0 };
  for (const r of testAgg) {
    if (r._id === 'Pending') testing.pending = r.count || 0;
    else if (r._id === 'Passed') testing.passed = r.count || 0;
    else if (r._id === 'Failed') testing.failed = r.count || 0;
  }

  return res.status(200).json({
    period,
    district,
    collections: { count: collections, units: collections },
    issues: { count: fulfilledCount, units: fulfilledAgg[0]?.units || 0 },
    newDonors,
    requests: totalRequests,
    fulfilled: fulfilledCount,
    fulfilment:
      totalRequests > 0
        ? Math.round((fulfilledCount / totalRequests) * 100)
        : 0,
    stockByGroup,
    testing,
    expiry: { expired, expiringSoon },
  });
});

export default { getStats, getDistrictStats, getDistrictsOverview, getReports };
