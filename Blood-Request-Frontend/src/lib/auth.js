import {
  ApiError,
  apiFetch,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  toUserMessage,
} from './api.js'

const USER_KEY = 'hospitalUser'
const REMEMBER_KEY = 'hospitalRememberedEmail'
const REGISTERED_KEY = 'registeredHospital'
const LOCAL_SESSION_KEY = 'hospitalLocalSession'

const DEMO_CREDENTIALS = { email: 'demo@hospital.com', password: 'Demo@1234' }

/** Backend unreachable (DNS/refused/offline) — fetch throws TypeError, never ApiError. */
function isNetworkError(err) {
  return !(err instanceof ApiError)
}

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
  if (getAccessToken()) return true
  try {
    return localStorage.getItem(LOCAL_SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

function setLocalSession(on) {
  try {
    if (on) localStorage.setItem(LOCAL_SESSION_KEY, 'true')
    else localStorage.removeItem(LOCAL_SESSION_KEY)
  } catch {
    /* ignore */
  }
}

/* ---------- Offline fallback (backend unreachable) ---------- */

function localSignIn(user) {
  setLocalSession(true)
  writeUser({ ...user, _offline: true })
  return { ...user, _offline: true }
}

function localLoginUser({ email, password }) {
  const registered = readJSON(REGISTERED_KEY)
  if (registered && registered.email === email && registered.password === password) {
    return localSignIn({
      email,
      hospitalName: registered.hospitalName || '',
      phone: registered.phone || '',
    })
  }
  if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
    return localSignIn({
      email: DEMO_CREDENTIALS.email,
      hospitalName: 'Demo Hospital',
      phone: '9876543210',
    })
  }
  if (!registered) {
    throw new Error('No account found. Please register first.')
  }
  throw new Error('Invalid email or password.')
}

function localRegisterHospital(form) {
  const { confirmPassword, password, ...rest } = form
  void confirmPassword
  const record = { hospitalType: 'Private', ...rest, password }
  try {
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(record))
  } catch {
    throw new Error('Could not save the account on this device.')
  }
  return localLoginUser({ email: record.email, password })
}

export function getCurrentUser() {
  return readJSON(USER_KEY)
}

/** Compat alias — profile now comes from the backend session. */
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
 * POST /api/hospitals/register — creates the account AND logs in
 * (backend returns { user, accessToken } + refresh cookie).
 * Backend unreachable-na local-ah register panni offline session create pannum.
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
    if (isNetworkError(err)) {
      setLocalSession(false)
      return localRegisterHospital(form)
    }
    throw new Error(toUserMessage(err, 'Registration failed. Please try again.'))
  }
  setLocalSession(false)
  if (data?.accessToken) setAccessToken(data.accessToken)
  writeUser(data?.user || null)
  return data?.user || null
}

export async function loginUser({ email, password }) {
  let data
  try {
    data = await apiFetch('/api/hospitals/login', {
      method: 'POST',
      body: { email, password },
    })
  } catch (err) {
    if (isNetworkError(err)) {
      setLocalSession(false)
      return localLoginUser({ email, password })
    }
    throw new Error(toUserMessage(err, 'Invalid email or password.'))
  }
  setLocalSession(false)
  if (data?.accessToken) setAccessToken(data.accessToken)
  writeUser(data?.user || null)
  return data?.user || null
}

export async function demoLogin() {
  try {
    return await loginUser(DEMO_CREDENTIALS)
  } catch (err) {
    if (isNetworkError(err)) {
      setLocalSession(false)
      return localLoginUser(DEMO_CREDENTIALS)
    }
    throw err
  }
}

export function getDemoCredentials() {
  return { ...DEMO_CREDENTIALS }
}

export async function logoutUser() {
  try {
    await apiFetch('/api/hospitals/logout', { method: 'POST' })
  } catch {
    /* best-effort — still clear local session below */
  }
  clearAccessToken()
  setLocalSession(false)
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
