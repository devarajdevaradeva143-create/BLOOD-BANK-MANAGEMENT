const REQUESTS_KEY = 'bloodtrack-requests-v1'

function readAll() {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

export function getRequests() {
  return readAll().slice().reverse()
}

// Andha district admin-ku mattum request theriyanum-na indha helper-ah use pannu.
export function getRequestsByDistrict(districtId) {
  const id = String(districtId || '').trim().toLowerCase()
  if (!id || id === 'all') return getRequests()
  return readAll()
    .filter((r) => String(r.districtId || '').trim().toLowerCase() === id)
    .slice()
    .reverse()
}

export function getDistrictsInRequests() {
  const map = new Map()
  for (const r of readAll()) {
    const id = String(r.districtId || '').trim()
    if (!id) continue
    if (!map.has(id.toLowerCase())) {
      map.set(id.toLowerCase(), {
        id,
        name: r.districtName || id,
      })
    }
  }
  return [...map.values()]
}

export function getRequestById(requestId) {
  return readAll().find((r) => r.requestId === requestId) || null
}

export function saveRequest(record) {
  const list = readAll()
  list.push({
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...record,
  })
  return writeAll(list)
}

export function updateRequestStatus(requestId, status) {
  const list = readAll()
  const index = list.findIndex((r) => r.requestId === requestId)
  if (index === -1) return false
  list[index] = { ...list[index], status }
  return writeAll(list)
}

export function getStats() {
  const list = readAll()
  const total = list.length
  const approved = list.filter((r) => r.status === 'approved').length
  const pending = list.filter((r) => r.status !== 'approved').length
  const emergency = list.filter((r) => r.requestType === 'emergency').length
  return { total, approved, pending, emergency }
}

export default { getRequests, getRequestById, saveRequest, updateRequestStatus, getStats }
