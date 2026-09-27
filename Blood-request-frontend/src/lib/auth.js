import { API_BASE } from './api.js'

const REGISTERED_KEY = 'registeredHospital'
const LOGGED_IN_KEY = 'hospitalLoggedIn'
const USER_KEY = 'hospitalUser'
const DEMO_OVERRIDE_KEY = 'hospitalDemoPasswordOverride'

const DEMO_ACCOUNT = {
  hospitalName: 'Demo Hospital',
  registrationNumber: 'TN-DEMO-0001',
  hospitalId: 'HOSP-TN-0001',
  hospitalType: 'Private',
  district: 'Chennai',
  address: '123 Main Road, Chennai, Tamil Nadu',
  pincode: '600001',
  email: 'demo@hospital.com',
  phone: '9876543210',
  emergencyContact: '9876543211',
  website: 'https://demohospital.example.in',
  officerName: 'Dr. R. Kumar',
  officerDesignation: 'Medical Superintendent',
  officerContact: '9876543212',
  password: 'Demo@1234',
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getRegisteredHospital() {
  return readJSON(REGISTERED_KEY)
}

export function isLoggedIn() {
  try {
    return localStorage.getItem(LOGGED_IN_KEY) === 'true'
  } catch {
    return false
  }
}

export function getCurrentUser() {
  return readJSON(USER_KEY)
}

export function registerHospital(form) {
  localStorage.setItem(REGISTERED_KEY, JSON.stringify(form))
}

export function getHospitalProfile() {
  const registered = getRegisteredHospital()
  if (registered) return registered
  if (isLoggedIn()) {
    const user = getCurrentUser()
    if (user?.email === DEMO_ACCOUNT.email) return DEMO_ACCOUNT
  }
  return null
}

export function updateHospitalProfile(patch) {
  const base = getHospitalProfile() || {}
  const next = { ...base, ...patch }
  if (next.email === DEMO_ACCOUNT.email) {
    next.password = getDemoPassword()
  }
  localStorage.setItem(REGISTERED_KEY, JSON.stringify(next))

  const user = getCurrentUser()
  if (user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        ...user,
        hospitalName: next.hospitalName || user.hospitalName,
        phone: next.phone || user.phone,
      }),
    )
  }
  return next
}

export function loginUser({ email, password }) {
  const registered = getRegisteredHospital()

  if (registered && registered.email === email && registered.password === password) {
    return signIn({ email, hospitalName: registered.hospitalName || '', phone: registered.phone || '' })
  }

  if (email === DEMO_ACCOUNT.email && password === getDemoPassword()) {
    return signIn({ email: DEMO_ACCOUNT.email, hospitalName: DEMO_ACCOUNT.hospitalName, phone: DEMO_ACCOUNT.phone })
  }

  if (!registered) {
    throw new Error('No account found. Please register first.')
  }

  throw new Error('Invalid email or password.')
}

function signIn(user) {
  localStorage.setItem(LOGGED_IN_KEY, 'true')
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}

export function logoutUser() {
  try {
    localStorage.removeItem(LOGGED_IN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    /* ignore */
  }
}

export function demoLogin() {
  return loginUser({ email: DEMO_ACCOUNT.email, password: getDemoPassword() })
}

export function getDemoCredentials() {
  return { email: DEMO_ACCOUNT.email, password: getDemoPassword() }
}

export function getDemoPassword() {
  try {
    return localStorage.getItem(DEMO_OVERRIDE_KEY) || DEMO_ACCOUNT.password
  } catch {
    return DEMO_ACCOUNT.password
  }
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  return { status: res.status, ok: res.ok, data }
}

// Real-world flow: OTP is generated + hashed server-side
// (Mongo `otps`, purpose 'reset', 5-min TTL, 60s cooldown, 5 attempts).
// The code is NEVER returned to the client — in dev it is logged by the
// backend as `[OTP:reset] hospital-email:<email> -> <code>`.
export async function requestHospitalPasswordReset(email) {
  const normalized = String(email || '').trim().toLowerCase()

  // Preserve UX for local-only accounts, but OTP itself is server-side.
  if (!isLocalAccount(normalized)) return { ok: false, reason: 'not_found' }

  let res
  try {
    res = await postJson('/api/hospitals/forgot-password', { email: normalized })
  } catch {
    return { ok: false, reason: 'network' }
  }

  if (res.ok) return { ok: true }
  if (res.status === 429) return { ok: false, reason: 'cooldown' }
  if (res.status === 400) return { ok: false, reason: 'invalid' }
  return { ok: false, reason: 'network' }
}

// Verifies OTP server-side, then syncs the local copy so login works
// with the new password (registered account or demo override).
export async function confirmHospitalPasswordReset({ email, code, newPassword }) {
  const normalized = String(email || '').trim().toLowerCase()
  const plainCode = String(code || '').trim()

  let res
  try {
    res = await postJson('/api/hospitals/reset-password', {
      email: normalized,
      code: plainCode,
      newPassword,
    })
  } catch {
    return { ok: false, reason: 'network' }
  }

  if (!res.ok) {
    if (res.status === 429) return { ok: false, reason: 'cooldown' }
    return { ok: false, reason: 'otp_invalid' }
  }

  try {
    if (isDemoEmail(normalized)) {
      localStorage.setItem(DEMO_OVERRIDE_KEY, newPassword)
    } else {
      const registered = getRegisteredHospital()
      if (registered && String(registered.email || '').trim().toLowerCase() === normalized) {
        registered.password = newPassword
        localStorage.setItem(REGISTERED_KEY, JSON.stringify(registered))
      }
    }
  } catch {
    /* ignore storage errors */
  }
  return { ok: true }
}

function isDemoEmail(email) {
  return String(email || '').trim().toLowerCase() === DEMO_ACCOUNT.email.toLowerCase()
}

function isLocalAccount(email) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return false
  if (isDemoEmail(normalized)) return true
  const registered = getRegisteredHospital()
  return !!registered && String(registered.email || '').trim().toLowerCase() === normalized
}
