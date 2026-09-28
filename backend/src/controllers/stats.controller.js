import { asyncHandler } from '../middleware/asyncHandler.js';
import Donor from '../models/Donor.js';
import BloodRequest from '../models/BloodRequest.js';
import BloodUnit from '../models/BloodUnit.js';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';

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

export default { getStats, getDistrictStats };
