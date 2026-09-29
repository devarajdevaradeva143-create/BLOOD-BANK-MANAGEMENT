import { clearAccessToken } from "../lib/api";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const REGISTERED_KEY = "registeredDonor";

function readRegisteredDonor() {
  try {
    return JSON.parse(localStorage.getItem(REGISTERED_KEY));
  } catch {
    return null;
  }
}

function isLocalAccount(email) {
  const normalized = String(email).trim().toLowerCase();
  const donor = readRegisteredDonor();
  return (
    !!donor &&
    String(donor.email || "").trim().toLowerCase() === normalized
  );
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

/**
 * Server donor -> the localStorage profile shape used by Profile/Donate pages.
 * Local-only extras (photo, totals) are merged in by the caller.
 */
export function toLocalDonor(user) {
  if (!user) return null;
  const created = user.createdAt ? String(user.createdAt).slice(0, 10) : "";
  return {
    donorId: user.donorId || "",
    name: user.fullName || "",
    email: user.email || "",
    phone: user.mobile || "",
    dob: user.dob || "",
    gender: user.gender || "",
    bloodGroup: user.bloodGroup || "",
    district: user.district || "",
    districtId: user.districtId || "",
    city: user.city || "",
    pincode: user.pincode || "",
    address: user.address || "",
    registrationDate: created,
  };
}

/** Merge the server profile into the local one (keeps photo / totals). */
export function saveLocalDonor(user) {
  const incoming = toLocalDonor(user);
  if (!incoming) return null;
  const prev = readRegisteredDonor() || {};
  const merged = { ...prev };

  for (const [key, value] of Object.entries(incoming)) {
    const empty = value === "" || value === null || value === undefined;
    // Server wins when it has a value; never blank out a locally filled field.
    if (!empty || merged[key] === undefined) merged[key] = value;
  }

  merged.donorId = incoming.donorId || prev.donorId || "";
  merged.registrationDate =
    incoming.registrationDate || prev.registrationDate || "";
  merged.totalDonations = Number(prev.totalDonations ?? 0) || 0;
  merged.isActive = prev.isActive ?? true;
  merged.photo = prev.photo || prev.photoUrl || prev.avatar || "";

  try {
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage errors
  }
  return merged;
}

// Secure real-time flow: OTP is generated + hashed server-side
// (Mongo `otps`, purpose 'reset', 5-min TTL, 60s cooldown, 5 attempts).
// The code is NEVER returned to the client — in dev it is logged by the
// backend as `[OTP:reset] donor-email:<email> -> <code>`.
export async function requestPasswordReset(email) {
  const normalized = String(email || "").trim().toLowerCase();

  // Local UX guard (the backend answer is always generic, no enumeration).
  if (!isLocalAccount(normalized)) return { ok: false, reason: "not_found" };

  let res;
  try {
    res = await postJson("/api/donors/forgot-password", { email: normalized });
  } catch {
    return { ok: false, reason: "network" };
  }

  if (res.ok) return { ok: true };
  if (res.status === 429) return { ok: false, reason: "cooldown" };
  if (res.status === 400) return { ok: false, reason: "invalid" };
  return { ok: false, reason: "network" };
}

// Verifies OTP server-side and stores the new bcrypt hash — login then
// checks the backend, so no local password copy exists anymore.
export async function resetPassword({ email, otp, newPassword }) {
  const normalized = String(email || "").trim().toLowerCase();
  const code = String(otp || "").trim();

  let res;
  try {
    res = await postJson("/api/donors/reset-password", {
      email: normalized,
      code,
      newPassword,
    });
  } catch {
    return { ok: false, reason: "network" };
  }

  if (!res.ok) {
    if (res.status === 429) return { ok: false, reason: "cooldown" };
    return { ok: false, reason: "otp_invalid" };
  }

  // Any session opened with the old password is now dead.
  clearAccessToken();
  return { ok: true };
}
