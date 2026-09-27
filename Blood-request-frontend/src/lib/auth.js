const REGISTERED_KEY = 'registeredHospital'
const LOGGED_IN_KEY = 'hospitalLoggedIn'
const USER_KEY = 'hospitalUser'

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
    next.password = DEMO_ACCOUNT.password
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

  if (email === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
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
  return loginUser({ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password })
}

export function getDemoCredentials() {
  return { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password }
}
