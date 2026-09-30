import crypto from 'node:crypto';
import Notification from '../models/Notification.js';

const ALPHA_NUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const AUDIENCES = ['district', 'donor', 'hospital'];
const TYPES = ['request', 'donation', 'stock', 'testing', 'expiry', 'message', 'system'];

function randomFrom(chars, length) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

/** e.g. NOTF-20260930-A1B2 */
export function genNotificationId(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `NOTF-${y}${m}${d}-${randomFrom(ALPHA_NUM, 4)}`;
}

/**
 * Best-effort notification creator — NEVER throws.
 * Returns the created doc, or null when skipped/failed.
 */
export async function notify({
  audience = 'district',
  recipientId = '',
  districtId = '',
  type = 'system',
  title,
  body = '',
  link = '',
} = {}) {
  try {
    if (!title || !String(title).trim()) return null;
    if (!AUDIENCES.includes(audience)) return null;
    if (!TYPES.includes(type)) return null;

    const doc = await Notification.create({
      notificationId: genNotificationId(),
      audience,
      recipientId: String(recipientId || '').trim(),
      districtId: String(districtId || '').trim().toLowerCase(),
      type,
      title: String(title).trim(),
      body: String(body || '').trim(),
      link: String(link || '').trim(),
      read: false,
    });
    return doc;
  } catch {
    return null;
  }
}

export default { notify, genNotificationId };
