import { cancelRequestApi, listRequestsApi } from './api.js'

/**
 * Server-backed request store. All reads go to GET /api/requests
 * (scoped to the logged-in hospital by the backend).
 */

export async function getRequests(params = {}) {
  const data = await listRequestsApi({ limit: 100, ...params })
  const list = Array.isArray(data?.data) ? data.data : []
  return { requests: list, total: data?.total ?? list.length }
}

export async function cancelRequest(requestId) {
  const data = await cancelRequestApi(requestId)
  return data?.request || null
}

export function computeStats(list) {
  const arr = Array.isArray(list) ? list : []
  const total = arr.length
  const approved = arr.filter((r) => r.status === 'approved').length
  const pending = arr.filter((r) => r.status === 'submitted').length
  const fulfilled = arr.filter((r) => r.status === 'fulfilled').length
  const cancelled = arr.filter((r) => r.status === 'cancelled').length
  const emergency = arr.filter((r) => r.requestType === 'emergency').length
  return { total, approved, pending, fulfilled, cancelled, emergency }
}

export default { getRequests, cancelRequest, computeStats }
