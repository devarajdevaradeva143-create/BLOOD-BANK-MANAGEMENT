import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplet,
  FileClock,
  Filter,
  Hash,
  Search,
  Siren,
  Users,
  XCircle,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cancelRequest, computeStats, getRequests } from '../lib/requests'
import { toUserMessage } from '../lib/api'
import { useLanguage } from '../context/useLanguage'
import { districts, getDistrictName } from '../data/districts'

const PAGE_LIMIT = 20
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function fb(value) {
  if (value === undefined || value === null || value === '') return '—'
  return value
}

function cap(value) {
  if (value === undefined || value === null || value === '') return '—'
  const text = String(value)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatDate(value, lang) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(value, lang) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString(lang === 'ta' ? 'ta-IN' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function requiredLabel(request, lang) {
  const day = formatDate(request.requiredDate, lang)
  const time = request.requiredTime ? String(request.requiredTime) : ''
  return time ? `${day} · ${time}` : day
}

function districtLabel(request, lang) {
  const name = request.districtName
  if (name) {
    const match = districts.find((d) => d.en === name || d.ta === name || d.id === name)
    if (match) return lang === 'ta' ? match.ta : match.en
    return String(name)
  }
  if (request.districtId) return getDistrictName(request.districtId, lang) || String(request.districtId)
  return '—'
}

function typeLabel(request) {
  return request.category || request.requestType || '—'
}

function StatusPill({ status, t }) {
  const s = String(status ?? '').toLowerCase()
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        {t('hist.statusApproved')}
      </span>
    )
  }
  if (s === 'fulfilled') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t('hist.statusFulfilled')}
      </span>
    )
  }
  if (s === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        {t('hist.statusCancelled')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      {t('hist.statusSubmitted')}
    </span>
  )
}

function PriorityPill({ priority, t }) {
  const tone =
    priority === 'critical'
      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
      : priority === 'high'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  const text =
    priority === 'critical' ? t('hist.priorityCritical') : priority === 'high' ? t('hist.priorityHigh') : cap(priority)
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${tone}`}
    >
      {priority === 'critical' ? <Siren className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {text}
    </span>
  )
}

function TypeBadge({ request, t }) {
  const label = typeLabel(request)
  const emergency =
    String(request.requestType ?? '').toLowerCase() === 'emergency' ||
    String(request.category ?? '').toLowerCase() === 'emergency'
  const category = String(request.category ?? '').toLowerCase()
  const text = emergency
    ? t('hist.typeEmergency')
    : category === 'routine'
      ? t('hist.typeRoutine')
      : category === 'surgery'
        ? t('hist.typeSurgery')
        : category === 'icu'
          ? t('hist.typeIcu')
          : cap(label)
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
        emergency
          ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900'
          : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
      }`}
    >
      {emergency ? <Siren className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {text}
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
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
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
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${tones[tone] || tones.slate}`}
      >
        <Hash className="h-4 w-4" aria-hidden="true" />
      </span>
    </div>
  )
}

function CancelAction({ request, cancelling, onCancel, t }) {
  if (String(request.status ?? '').toLowerCase() !== 'submitted') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
        {request.status === 'cancelled'
          ? t('hist.statusCancelled')
          : request.status === 'fulfilled'
            ? t('hist.statusFulfilled')
            : t('hist.statusApproved')}
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onCancel(request.requestId)}
      disabled={cancelling}
      className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition duration-200 hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
      {cancelling ? t('hist.cancelling') : t('hist.cancel')}
    </button>
  )
}

export default function RequestHistoryPage() {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [bloodGroupFilter, setBloodGroupFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [cancellingId, setCancellingId] = useState(null)
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, fulfilled: 0, cancelled: 0, emergency: 0 })

  const fill = (template, values) =>
    Object.entries(values).reduce((acc, [k, v]) => acc.replace(`{${k}}`, v), template)

  // Search input -> debounced server query (400ms), reset to page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Main page fetch: server-filtered + server-paginated.
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const params = {
          page,
          limit: PAGE_LIMIT,
        }
        if (debouncedSearch) params.search = debouncedSearch
        if (statusFilter !== 'all') params.status = statusFilter
        if (bloodGroupFilter !== 'all') params.bloodGroup = bloodGroupFilter
        // Backend requestType is emergency|normal. Only emergency maps to a
        // server param; routine/surgery/icu live in `category` and are
        // filtered client-side below.
        if (typeFilter === 'emergency') params.requestType = 'emergency'

        const { requests: list, total: serverTotal } = await getRequests(params)
        if (!active) return
        let visible = Array.isArray(list) ? list : []
        if (typeFilter !== 'all') {
          const want = typeFilter.toLowerCase()
          visible = visible.filter((r) => {
            const rt = String(r.requestType ?? '').toLowerCase()
            const cat = String(r.category ?? '').toLowerCase()
            if (want === 'emergency') return rt === 'emergency' || cat === 'emergency'
            return cat === want
          })
        }
        setRequests(visible)
        setTotal(typeof serverTotal === 'number' ? serverTotal : visible.length)
      } catch (err) {
        if (!active) return
        if (err?.status === 401) {
          navigate('/hospital/login')
          return
        }
        setError(toUserMessage(err, t('hist.errLoad')))
        setRequests([])
        setTotal(0)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [debouncedSearch, statusFilter, bloodGroupFilter, typeFilter, page, retryKey, navigate])

  // Lightweight stats fetch (limit 100) with the same server filters.
  useEffect(() => {
    let active = true
    async function loadStats() {
      try {
        const params = { page: 1, limit: 100 }
        if (debouncedSearch) params.search = debouncedSearch
        if (statusFilter !== 'all') params.status = statusFilter
        if (bloodGroupFilter !== 'all') params.bloodGroup = bloodGroupFilter
        if (typeFilter === 'emergency') params.requestType = 'emergency'
        const { requests: list } = await getRequests(params)
        if (!active) return
        let pool = Array.isArray(list) ? list : []
        if (typeFilter !== 'all') {
          const want = typeFilter.toLowerCase()
          pool = pool.filter((r) => {
            const rt = String(r.requestType ?? '').toLowerCase()
            const cat = String(r.category ?? '').toLowerCase()
            if (want === 'emergency') return rt === 'emergency' || cat === 'emergency'
            return cat === want
          })
        }
        setStats(computeStats(pool))
      } catch (err) {
        if (!active) return
        if (err?.status === 401) {
          navigate('/hospital/login')
          return
        }
        // Stats failure should not break the page; fall back to current page data.
        setStats((prev) => {
          try {
            return computeStats(requests)
          } catch {
            return prev
          }
        })
      }
    }
    loadStats()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, bloodGroupFilter, typeFilter, retryKey, navigate])

  async function handleCancel(requestId) {
    if (!requestId || cancellingId) return
    setCancellingId(requestId)
    try {
      await cancelRequest(requestId)
      setRequests((prev) =>
        prev.map((r) => (r.requestId === requestId ? { ...r, status: 'cancelled' } : r))
      )
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, (prev.pending ?? 0) - 1),
        cancelled: (prev.cancelled ?? 0) + 1,
      }))
      toast.success(t('hist.toastCancelled'))
    } catch (err) {
      if (err?.status === 401) {
        navigate('/hospital/login')
        return
      }
      toast.error(toUserMessage(err, t('hist.errCancel')))
    } finally {
      setCancellingId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / PAGE_LIMIT))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const isEmpty = !loading && !error && requests.length === 0

  function resetFilters() {
    setSearch('')
    setDebouncedSearch('')
    setStatusFilter('all')
    setTypeFilter('all')
    setBloodGroupFilter('all')
    setPage(1)
  }

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
                {t('hist.title')}
              </h1>
              <p className="text-xs text-red-100 sm:text-sm">
                {t('hist.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white">
              <Hash className="h-3.5 w-3.5" aria-hidden="true" />
              {fill(t('hist.totalBadge'), { count: total })}
            </span>
            <Link
              to="/hospital/home"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition duration-200 hover:bg-red-50 active:scale-[0.98]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t('hist.backToProfile')}
            </Link>
          </div>
        </div>
      </div>

      <div className="card animate-fade-in-up p-5 sm:p-6">
        <div className="mb-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <SectionHeader
            icon={Filter}
            title={t('hist.filterTitle')}
            subtitle={t('hist.filterSubtitle')}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('hist.searchPh')}
              className="input-base !pl-10"
              aria-label={t('hist.searchAria')}
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(1)
              }}
              className="input-base appearance-none pr-9"
              aria-label={t('hist.filterStatusAria')}
            >
              <option value="all">{t('hist.allStatuses')}</option>
              <option value="submitted">{t('hist.statusSubmitted')}</option>
              <option value="approved">{t('hist.statusApproved')}</option>
              <option value="fulfilled">{t('hist.statusFulfilled')}</option>
              <option value="cancelled">{t('hist.statusCancelled')}</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value)
                setPage(1)
              }}
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
          <div className="relative">
            <select
              value={bloodGroupFilter}
              onChange={(event) => {
                setBloodGroupFilter(event.target.value)
                setPage(1)
              }}
              className="input-base appearance-none pr-9"
              aria-label="Filter by blood group"
            >
              <option value="all">All Groups</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Clear
          </button>
        </div>
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          {total} request(s) · Page {safePage} of {totalPages}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatPill label="Total" value={stats.total ?? 0} tone="slate" />
        <StatPill label="Submitted" value={stats.pending ?? 0} tone="amber" />
        <StatPill label="Approved" value={stats.approved ?? 0} tone="emerald" />
        <StatPill label="Fulfilled" value={stats.fulfilled ?? 0} tone="blue" />
        <StatPill label="Cancelled" value={stats.cancelled ?? 0} tone="red" />
        <StatPill label="Emergency" value={stats.emergency ?? 0} tone="rose" />
      </div>

      {loading ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-red-200 border-t-red-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading requests…</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Fetching the latest history from the server</p>
        </div>
      ) : error ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300">
            <XCircle className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="btn-primary mt-1 !py-2 text-xs"
          >
            Retry
          </button>
        </div>
      ) : isEmpty ? (
        <div className="card p-5 sm:p-6">
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 px-4 py-12 text-center dark:border-slate-700">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Droplet className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {total === 0 ? 'No requests yet' : 'No requests match your filters'}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {total === 0
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
                subtitle="Cancel a submitted request, or track its status"
              />
            </div>
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="pb-3 font-semibold">Request ID</th>
                  <th className="pb-3 font-semibold">Patient</th>
                  <th className="pb-3 font-semibold">Blood Group</th>
                  <th className="pb-3 font-semibold">Units</th>
                  <th className="pb-3 font-semibold">Required</th>
                  <th className="pb-3 font-semibold">District</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.requestId}
                    className="border-t border-slate-100 transition hover:bg-red-50/40 dark:border-slate-800 dark:hover:bg-red-950/20"
                  >
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-100">
                      <span className="inline-flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                        {fb(request.requestId)}
                      </span>
                      <p className="mt-0.5 text-[11px] font-normal text-slate-400 dark:text-slate-500">
                        {formatDate(request.createdAt)} · {formatTime(request.createdAt)}
                      </p>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                        <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                        {fb(request.patientName)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900">
                        <Droplet className="h-3.5 w-3.5" aria-hidden="true" />
                        {fb(request.bloodGroup)}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-600 dark:text-slate-300">
                      {fb(request.units)}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                        {requiredLabel(request)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {districtLabel(request)}
                      </span>
                    </td>
                    <td className="py-3">
                      <TypeBadge request={request} />
                    </td>
                    <td className="py-3">
                      <PriorityPill priority={request.priority} />
                    </td>
                    <td className="py-3">
                      <StatusPill status={request.status} />
                    </td>
                    <td className="py-3 text-right">
                      <CancelAction
                        request={request}
                        cancelling={cancellingId === request.requestId}
                        onCancel={handleCancel}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Page {safePage} of {totalPages} · {total} total request(s)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            <div className="card p-4">
              <SectionHeader
                icon={FileClock}
                title="All Requests"
                subtitle={`${requests.length} request(s) on page ${safePage} of ${totalPages}`}
              />
            </div>
            {requests.map((request) => (
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
                  <TypeBadge request={request} />
                  <PriorityPill priority={request.priority} />
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {districtLabel(request)}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2">
                  <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Patient
                    </dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                      {fb(request.patientName)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Blood Group
                    </dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-red-700 dark:text-red-300">
                      <Droplet className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                      {fb(request.bloodGroup)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Units
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {fb(request.units)}
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
                    {fb(request.hospitalName) || `Group ${fb(request.groupId)}`}
                  </p>
                  <CancelAction
                    request={request}
                    cancelling={cancellingId === request.requestId}
                    onCancel={handleCancel}
                  />
                </div>
              </div>
            ))}
            <div className="card flex items-center justify-between gap-3 p-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Page {safePage} of {totalPages} · {total} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
