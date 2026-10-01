// backend/src/services/sms.service.js
// OTP SMS sender — providers: log (dev) | supabase (prod via Edge Function).
// Env (user adds in Vercel dashboard / local .env — this file only reads):
//   OTP_PROVIDER=supabase
//   SUPABASE_SMS_URL=https://<project>.supabase.co/functions/v1/send-sms
//   SUPABASE_SMS_KEY=<anon-or-service-key, server-side only>
import { config } from '../config/env.js';

/**
 * Send an SMS. Never throws for `log` provider.
 * @param {string} target mobile number (10-digit or +E.164)
 * @param {string} message plain text
 */
export async function sendSms(target, message) {
  const provider = config.otp?.provider || 'log';

  // Dev behaviour preserved: log + return (see otp.controller requestOtp).
  if (provider === 'log') {
    console.log(`[SMS:log] ${target} -> ${message}`);
    return { ok: true, provider: 'log' };
  }

  if (provider === 'supabase') {
    const url = process.env.SUPABASE_SMS_URL || config.otp?.supabaseSmsUrl || '';
    const key = process.env.SUPABASE_SMS_KEY || config.otp?.supabaseSmsKey || '';
    if (!url || !key) throw new Error('Missing SUPABASE_SMS_URL / SUPABASE_SMS_KEY');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ to: normalizePhone(target), message: String(message) }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Supabase SMS failed ${res.status}: ${txt.slice(0, 200)}`);
    }
    if (config.env !== 'production') console.log(`[SMS:supabase] ${target} -> sent`);
    return { ok: true, provider: 'supabase' };
  }

  throw new Error(`Unknown OTP_PROVIDER: ${provider}`);
}

/** 10-digit Indian mobile -> +91..., E.164 passthrough otherwise. */
export function normalizePhone(target) {
  const t = String(target || '').trim().replace(/[\s-]/g, '');
  if (/^[6-9]\d{9}$/.test(t)) return `+91${t}`;
  return t;
}

export default { sendSms, normalizePhone };
