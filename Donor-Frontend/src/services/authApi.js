const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function readRegisteredDonor() {
  try {
    return JSON.parse(localStorage.getItem("registeredDonor"));
  } catch {
    return null;
  }
}

function isLocalAccount(email) {
  const normalized = String(email).trim().toLowerCase();
  if (normalized === "demo@lifesaver.com") return true;
  const donor = readRegisteredDonor();
  return (
    !!donor &&
    String(donor.email || "").trim().toLowerCase() === normalized
  );
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
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

// Secure real-time flow: OTP is generated + hashed server-side
// (Mongo `otps`, purpose 'reset', 5-min TTL, 60s cooldown, 5 attempts).
// The code is NEVER returned to the client — in dev it is logged by the
// backend as `[OTP:reset] donor-email:<email> -> <code>`.
export async function requestPasswordReset(email) {
  const normalized = String(email || "").trim().toLowerCase();

  // Preserve UX for local-only accounts, but OTP itself is server-side.
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

// Verifies OTP server-side, then syncs the local demo copy so login works.
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

  // Backend verified OTP (and updated passwordHash when a DB donor exists).
  // Sync localStorage demo account so DonorLogin accepts the new password.
  try {
    const donor = readRegisteredDonor();
    if (
      donor &&
      String(donor.email || "").trim().toLowerCase() === normalized
    ) {
      donor.password = newPassword;
      localStorage.setItem("registeredDonor", JSON.stringify(donor));
    }
  } catch {
    /* ignore storage errors */
  }
  return { ok: true };
}
