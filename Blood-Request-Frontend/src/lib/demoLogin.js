// TEMP-DEMO-LOGIN: frontend-only demo session (no backend). Removal: delete this file + demoLoginHospital in auth.js + 401 guard in api.js + demo box in HospitalLogin.jsx + login.demoOffline key.
export const DEMO_LOGIN_ENABLED = true
export const DEMO_TOKEN = 'demo-token'
export const DEMO_HOSPITAL_USER = { hospitalName: 'Demo General Hospital', email: 'demo.hospital@demo.local', hospitalId: 'HOSP-DEMO-001', district: 'Chennai', districtId: 'chennai' }
export function isDemoSession() { try { return localStorage.getItem('hospitalAccessToken') === DEMO_TOKEN } catch { return false } }
