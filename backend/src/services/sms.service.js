// backend/src/services/sms.service.js
// OTP SMS sender — log only (free, no paid gateway).
// Backend console-la `[SMS:log] <target> -> <message>` varum.
// Real SMS thevaipatta apram provider add pannalam — ippo selave illa.
import { config } from '../config/env.js';

/**
 * Send an SMS. Log-only — never throws.
 * @param {string} target mobile number (10-digit or +E.164)
 * @param {string} message plain text
 */
export async function sendSms(target, message) {
  const provider = config.otp?.provider || 'log';

  // Log-only behaviour (see otp.controller requestOtp).
  // OTP_PROVIDER vera edhavadhu irundhalum log dhaan — paid gateway illa.
  if (provider !== 'log') {
    console.warn(`[SMS] Unknown OTP_PROVIDER "${provider}" — falling back to log`);
  }
  console.log(`[SMS:log] ${target} -> ${message}`);
  return { ok: true, provider: 'log' };
}

/** 10-digit Indian mobile -> +91..., E.164 passthrough otherwise. */
export function normalizePhone(target) {
  const t = String(target || '').trim().replace(/[\s-]/g, '');
  if (/^[6-9]\d{9}$/.test(t)) return `+91${t}`;
  return t;
}

export default { sendSms, normalizePhone };
