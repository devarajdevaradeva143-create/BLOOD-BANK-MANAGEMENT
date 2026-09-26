const DELAY_MS = 800;

const wait = (ms = DELAY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

function readRegisteredDonor() {
  try {
    return JSON.parse(localStorage.getItem("registeredDonor"));
  } catch {
    return null;
  }
}

// TODO(backend): replace with POST /api/auth/forgot-password (server mails the OTP)
export async function requestPasswordReset(email) {
  await wait();
  const donor = readRegisteredDonor();
  const found = donor && String(donor.email).trim().toLowerCase() === email;
  if (!found) return { ok: false, reason: "not_found" };

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  try {
    sessionStorage.setItem(`resetOtp:${email}`, otp);
  } catch {
    /* ignore storage errors */
  }

  // demo only: server will NOT return the OTP once email delivery is wired
  return { ok: true, otp };
}

// TODO(backend): replace with POST /api/auth/reset-password (verify OTP, save hash)
export async function resetPassword({ email, otp, newPassword }) {
  await wait();

  let storedOtp = null;
  try {
    storedOtp = sessionStorage.getItem(`resetOtp:${email}`);
  } catch {
    storedOtp = null;
  }
  if (!storedOtp || storedOtp !== otp) {
    return { ok: false, reason: "otp_invalid" };
  }

  const donor = readRegisteredDonor();
  if (!donor) return { ok: false, reason: "not_found" };

  donor.password = newPassword;
  try {
    localStorage.setItem("registeredDonor", JSON.stringify(donor));
    sessionStorage.removeItem(`resetOtp:${email}`);
  } catch {
    /* ignore storage errors */
  }
  return { ok: true };
}
