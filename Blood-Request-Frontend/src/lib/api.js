const _rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_BASE = String(_rawBase).trim().replace(/\/+$/, '')
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.warn('[api] VITE_API_URL is missing — falling back to localhost (prod build misconfigured)')
}

const TOKEN_KEY = 'hospitalAccessToken'

export class ApiError extends Error {
  constructor(message, status, issues) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.issues = issues || []
  }
}

export function getAccessToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAccessToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function clearAccessToken() {
  setAccessToken(null)
}

/** Join a server error (message + zod issues) into one readable string. */
export function toUserMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err instanceof ApiError) {
    if (err.issues && err.issues.length) {
      return err.issues.map((i) => i.message || `${i.path}: invalid`).join('. ')
    }
    if (err.message) return err.message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

async function parseJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function rawFetch(path, { auth = false, headers, body, ...rest } = {}) {
  const token = auth ? getAccessToken() : null
  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
    ...rest,
  })
}

let refreshPromise = null

function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hospitals/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        const data = await parseJson(res)
        if (res.ok && data?.accessToken) {
          setAccessToken(data.accessToken)
          try {
            if (data?.user) localStorage.setItem('hospitalUser', JSON.stringify(data.user))
          } catch {
            /* ignore */
          }
          return true
        }
      } catch {
        /* ignore */
      }
      return false
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/**
 * Authenticated JSON client. On 401 (auth routes) it tries one silent
 * refresh via the httpOnly cookie and retries once; if refresh fails the
 * session is cleared and an ApiError(401) is thrown.
 */
export async function apiFetch(path, options = {}) {
  const { auth = false, _retried, ...fetchOptions } = options
  const res = await rawFetch(path, { auth, ...fetchOptions })

  if (res.status === 401 && auth && !_retried) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return apiFetch(path, { ...options, _retried: true })
    }
    clearAccessToken()
    try {
      localStorage.removeItem('hospitalUser')
    } catch {
      /* ignore */
    }
  }

  const data = await parseJson(res)
  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed (${res.status})`
    throw new ApiError(message, res.status, data?.issues)
  }
  return data
}

/* ---------- Public endpoints (no auth) ---------- */

export async function fetchAvailability(districtId, bloodGroup, units) {
  const params = new URLSearchParams()
  if (districtId) params.set('districtId', districtId)
  if (bloodGroup) params.set('bloodGroup', bloodGroup)
  if (units !== undefined && units !== null && String(units) !== '') {
    params.set('units', String(units))
  }
  const qs = params.toString()
  return apiFetch(`/api/availability${qs ? `?${qs}` : ''}`)
}

export async function requestOtp(mobile) {
  return apiFetch('/api/otp/request', {
    method: 'POST',
    body: { mobile, purpose: 'request' },
  })
}

/* ---------- Hospital endpoints (auth) ---------- */

export async function submitBulkRequest(payload) {
  return apiFetch('/api/requests/bulk', {
    method: 'POST',
    auth: true,
    body: payload,
  })
}

export async function listRequestsApi(params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value) !== '' && value !== 'all') {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return apiFetch(`/api/requests${qs ? `?${qs}` : ''}`, { auth: true })
}

export async function cancelRequestApi(id) {
  return apiFetch(`/api/requests/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    auth: true,
    body: { status: 'cancelled' },
  })
}

/* ---------- Notification endpoints (auth) ---------- */

export async function listNotifications({ unreadOnly = false, limit } = {}) {
  const params = new URLSearchParams()
  if (unreadOnly) params.set('unreadOnly', 'true')
  if (limit !== undefined && limit !== null && String(limit) !== '') {
    params.set('limit', String(limit))
  }
  const qs = params.toString()
  return apiFetch(`/api/notifications${qs ? `?${qs}` : ''}`, { auth: true })
}

export async function getUnreadCount() {
  return apiFetch('/api/notifications/unread-count', { auth: true })
}

export async function markNotificationRead(id) {
  return apiFetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
    auth: true,
  })
}

export async function markAllNotificationsRead() {
  return apiFetch('/api/notifications/read-all', {
    method: 'PATCH',
    auth: true,
  })
}

export async function deleteNotification(id) {
  return apiFetch(`/api/notifications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  })
}

export { API_BASE }
