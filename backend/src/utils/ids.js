import crypto from 'node:crypto';

const ALPHA_NUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomFrom(chars, length) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

/** e.g. REQ-A3F9K2 */
export function genRequestId() {
  return `REQ-${randomFrom(ALPHA_NUM, 6)}`;
}

/** Bulk group id shared by all patients of one hospital submission, e.g. BR-2026-X7K9PQ */
export function genGroupId(date = new Date()) {
  return `BR-${date.getFullYear()}-${randomFrom(ALPHA_NUM, 6)}`;
}

/** e.g. BBMS-DNR-20260923-A1B2 */
export function genDonorId(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `BBMS-DNR-${y}${m}${d}-${randomFrom(ALPHA_NUM, 4)}`;
}

/** e.g. BU-a3f9k2 (lowercase, short unit code) */
export function genUnitCode() {
  return `BU-${crypto.randomBytes(3).toString('hex')}`;
}

export default { genRequestId, genGroupId, genDonorId, genUnitCode };
