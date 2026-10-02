// Clerk publishable-key helper (Donor register phone verification only).
// SECRET key never comes here — backend verifies Clerk tokens server-side.
export const CLERK_KEY = String(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''
).trim();

export function isClerkConfigured() {
  if (!CLERK_KEY) return false;
  return !/paste_here|placeholder|your_key/i.test(CLERK_KEY);
}

/** 10-digit Indian mobile -> E.164 (+91...), or "" when invalid. */
export function toE164Indian(mobile) {
  const t = String(mobile || '').trim();
  if (!/^[6-9]\d{9}$/.test(t)) return '';
  return `+91${t}`;
}

export default { CLERK_KEY, isClerkConfigured, toE164Indian };
