import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  Clock,
  Droplet,
  FileClock,
  Filter,
  Hash,
  Search,
  Siren,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getRequests, updateRequestStatus } from '../lib/requests'

function fb(value) {
  if (value === undefined || value === null || value === '') return '—'
  return value
}

function cap(value) {
  if (value === undefined || value === null || value === '') return '—'
  const text = String(value)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function requiredLabel(request) {
  const day = formatDate(request.requiredDate)
  const time = request.requiredTime ? String(request.requiredTime) : ''
  return time ? `${day} · ${time}` : day
}

function statusOf(request) {
  return request.status === 'approved' ? 'approved' : 'pending'
}

function StatusPill({ status }) {
  const approved = status === 'approved'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        approved
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
      }`}
    >
      {approved ? (
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {approved ? 'Approved' : 'Pending'}
    </span>
  )
}

function PriorityPill({ priority }) {
  const tone =
    priority === 'critical'
      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
      : priority === 'high'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${tone}`}
    >
      {priority === 'critical' ? <Siren className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {cap(priority)}
    </span>
  )
}

function TypeBadge({ type }) {
  const emergency = type === 'emergency'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
        emergency
          ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900'
          : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
      }`}
    >
      {emergency ? <Siren className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {cap(type)}
    </span>
  )
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-600/30">
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
  )
}

function StatPill({ label, value, tone }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  }
  return (
    <div className="card flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-lg font-bold leading-none text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${tones[tone]}`}
      >
        <Hash className="h-4 w-4" aria-hidden="true" />
      </span>
    </div>
  )
}

function ApproveButton({ request, onApprove }) {
  if (statusOf(request) === 'approved') {
    return (
      <button type="button" className="btn-primary !px-3 !py-1.5 text-xs" disabled>
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Approved
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onApprove(request.requestId)}
      className="btn-primary !px-3 !py-1.5 text-xs"
    >
      Approve
    </button>
  )
}

export default function RequestHistoryPage() {
  const [requests, setRequests] = useState(() => getRequests())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return requests.filter((request) => {
      const id = String(request.requestId ?? '').toLowerCase()
      if (query && !id.includes(query)) return false
      if (statusFilter !== 'all' && statusOf(request) !== statusFilter) return false
      if (
        typeFilter !== 'all' &&
        String(request.requestType ?? '').toLowerCase() !== typeFilter
      )
        return false
      return true
    })
  }, [requests, search, statusFilter, typeFilter])

  const stats = useMemo(
    () => ({
      total: filtered.length,
      pending: filtered.filter((r) => statusOf(r) === 'pending').length,
      approved: filtered.filter((r) => statusOf(r) === 'approved').length,
    }),
    [filtered]
  )

  function handleApprove(requestId) {
    updateRequestStatus(requestId, 'approved')
    setRequests((prev) =>
      prev.map((request) =>
        request.requestId === requestId ? { ...request, status: 'approved' } : request
      )
    )
    toast.success('Request approved')
  }

  const isEmpty = filtered.length === 0

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="animate-fade-in-up rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-red-700 p-5 text-white shadow-lg shadow-red-600/25 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-sm">
              <FileClock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-wide sm:text-xl">
                Request History
              </h1>
              <p className="text-xs text-red-100 sm:text-sm">
                All blood requests raised by this hospital
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white">
              <Hash className="h-3.5 w-3.5" aria-hidden="true" />
              {requests.length} Total
            </span>
            <Link
              to="/hospital/home"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition duration-200 hover:bg-red-50 active:scale-[0.98]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="card animate-fade-in-up p-5 sm:p-6">
        <div className="mb-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <SectionHeader
            icon={Filter}
            title="Filter Requests"
            subtitle="Search by request id, status or type"
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by request id..."
              className="input-base !pl-10"
              aria-label="Search by request id"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="input-base appearance-none pr-9"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="input-base appearance-none pr-9"
              aria-label="Filter by request type"
            >
              <option value="all">All Types</option>
              <option value="emergency">Emergency</option>
              <option value="routine">Routine</option>
              <option value="surgery">Surgery</option>
              <option value="icu">ICU</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          {filtered.length} of {requests.length} requests
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatPill label="Total" value={stats.total} tone="slate" />
        <StatPill label="Pending" value={stats.pending} tone="amber" />
        <StatPill label="Approved" value={stats.approved} tone="emerald" />
      </div>

      {isEmpty ? (
        <div className="card p-5 sm:p-6">
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 px-4 py-12 text-center dark:border-slate-700">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Droplet className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {requests.length === 0 ? 'No requests yet' : 'No requests match your filters'}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {requests.length === 0
                  ? 'Raise your first blood request to see it here'
                  : 'Try clearing the search or changing the filters'}
              </p>
            </div>
            <Link to="/request" className="btn-primary mt-1 !py-2 text-xs">
              <Droplet className="h-4 w-4" aria-hidden="true" />
              Raise a Request
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="card hidden animate-fade-in-up overflow-x-auto p-5 sm:p-6 md:block">
            <div className="mb-4 border-b border-slate-200 pb-4 dark:border-slate-800">
              <SectionHeader
                icon={FileClock}
                title="All Requests"
                subtitle="Approve pending blood requests instantly"
              />
            </div>
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="pb-3 font-semibold">Request ID</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 font-semibold">Patients</th>
                  <th className="pb-3 font-semibold">Units</th>
                  <th className="pb-3 font-semibold">Required</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((request) => (
                  <tr
                    key={request.requestId}
                    className="border-t border-slate-100 transition hover:bg-red-50/40 dark:border-slate-800 dark:hover:bg-red-950/20"
                  >
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-100">
                      <span className="inline-flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                        {fb(request.requestId)}
                      </span>
                    </td>
                    <td className="py-3">
                      <p className="text-slate-700 dark:text-slate-200">
                        {formatDate(request.createdAt)}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {formatTime(request.createdAt)}
                      </p>
                    </td>
                    <td className="py-3">
                      <TypeBadge type={request.requestType} />
                    </td>
                    <td className="py-3">
                      <PriorityPill priority={request.priority} />
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                        {fb(request.patients)}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {fb(request.totalUnits)}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                        {requiredLabel(request)}
                      </span>
                    </td>
                    <td className="py-3">
                      <StatusPill status={request.status} />
                    </td>
                    <td className="py-3 text-right">
                      <ApproveButton request={request} onApprove={handleApprove} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            <div className="card p-4">
              <SectionHeader
                icon={FileClock}
                title="All Requests"
                subtitle={`${filtered.length} request(s) shown`}
              />
            </div>
            {filtered.map((request) => (
              <div key={request.requestId} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                      <Hash className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                      {fb(request.requestId)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(request.createdAt)} · {formatTime(request.createdAt)}
                    </p>
                  </div>
                  <StatusPill status={request.status} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <TypeBadge type={request.requestType} />
                  <PriorityPill priority={request.priority} />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Patients
                    </dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                      {fb(request.patients)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Units
                    </dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      <Droplet className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                      {fb(request.totalUnits)}
                    </dd>
                  </div>
                  <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Required
                    </dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                      {requiredLabel(request)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Raised by {fb(request.doctor?.name)}
                  </p>
                  <ApproveButton request={request} onApprove={handleApprove} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
