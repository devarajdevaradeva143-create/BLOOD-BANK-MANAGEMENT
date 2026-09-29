import {
  apiFetch,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  toUserMessage,
} from './api.js'

const USER_KEY = 'hospitalUser'
const REMEMBER_KEY = 'hospitalRememberedEmail'

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    /* ignore */
  }
}

export function isLoggedIn() {
  return !!getAccessToken()
}

export function getCurrentUser() {
  return readJSON(USER_KEY)
}

export function getRegisteredHospital() {
  return getCurrentUser()
}

export function getHospitalProfile() {
  return getCurrentUser()
}

export function getRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBER_KEY) || ''
  } catch {
    return ''
  }
}

export function setRememberedEmail(email, remember) {
  try {
    if (remember && email) localStorage.setItem(REMEMBER_KEY, email)
    else localStorage.removeItem(REMEMBER_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * POST /api/hospitals/register — creates a PENDING account (no auto-login).
 * Real-website behavior: backend returns 201 { hospital } and the account
 * needs admin approval before login works.
 */
export async function registerHospital(form) {
  const { confirmPassword, password, ...rest } = form
  void confirmPassword
  let data
  try {
    data = await apiFetch('/api/hospitals/register', {
      method: 'POST',
      body: { ...rest, hospitalType: rest.hospitalType || 'Private', password },
    })
  } catch (err) {
    throw new Error(toUserMessage(err, 'Registration failed. Please try again.'))
  }
  // Pending approval — no session is issued at registration time.
  return data
}

export async function loginUser({ email, password }) {
  let data
  try {
    data = await apiFetch('/api/hospitals/login', {
      method: 'POST',
      body: { email, password },
    })
  } catch (err) {
    throw new Error(toUserMessage(err, 'Invalid email or password.'))
  }
  if (data?.accessToken) setAccessToken(data.accessToken)
  writeUser(data?.user || null)
  return data?.user || null
}

export async function logoutUser() {
  try {
    await apiFetch('/api/hospitals/logout', { method: 'POST' })
  } catch {
    /* best-effort — still clear local session below */
  }
  clearAccessToken()
  // Drop the legacy offline-demo session key (no longer read anywhere).
  try {
    localStorage.removeItem('hospitalLocalSession')
  } catch {
    /* ignore */
  }
  writeUser(null)
}

/** Refresh the cached profile from GET /api/hospitals/me. */
export async function fetchHospitalProfile() {
  const data = await apiFetch('/api/hospitals/me', { auth: true })
  writeUser(data?.user || null)
  return data?.user || null
}

export async function updateHospitalProfile(patch) {
  let data
  try {
    data = await apiFetch('/api/hospitals/me', {
      method: 'PATCH',
      auth: true,
      body: patch,
    })
  } catch (err) {
    throw new Error(toUserMessage(err, 'Could not save the profile.'))
  }
  writeUser(data?.user || null)
  return data?.user || null
}

// OTP is generated + hashed server-side (Mongo `otps`, purpose 'reset',
// 5-min TTL, 60s cooldown, 5 attempts). The code is NEVER returned to the
// client — in dev it is logged by the backend as
// `[OTP:reset] hospital-email:<email> -> <code>`.
export async function requestHospitalPasswordReset(email) {
  const normalized = String(email || '').trim().toLowerCase()
  let res
  try {
    res = await apiFetch('/api/hospitals/forgot-password', {
      method: 'POST',
      body: { email: normalized },
    })
  } catch (err) {
    if (err?.status === 429) return { ok: false, reason: 'cooldown' }
    if (err?.status === 400) return { ok: false, reason: 'invalid' }
    return { ok: false, reason: 'network' }
  }
  if (res) return { ok: true }
  return { ok: false, reason: 'network' }
}

// Verifies OTP server-side and sets the new password hash in the database.
// No local password sync needed — login always checks the backend.
export async function confirmHospitalPasswordReset({ email, code, newPassword }) {
  const normalized = String(email || '').trim().toLowerCase()
  const plainCode = String(code || '').trim()
  try {
    await apiFetch('/api/hospitals/reset-password', {
      method: 'POST',
      body: { email: normalized, code: plainCode, newPassword },
    })
  } catch (err) {
    if (err?.status === 429) return { ok: false, reason: 'cooldown' }
    return { ok: false, reason: 'otp_invalid' }
  }
  return { ok: true }
}
