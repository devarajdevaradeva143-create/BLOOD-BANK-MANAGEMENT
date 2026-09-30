import { Bell, BellRing, CheckCheck, CheckCircle2, ChevronRight, Info, Siren, Trash2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/useLanguage'
import { deleteNotification, listNotifications, markAllNotificationsRead, markNotificationRead, toUserMessage } from '../lib/api'

const PAGE_STEP = 20

function typeIcon(type) {
  const t = String(type ?? '').toLowerCase()
  if (t.includes('approv') || t.includes('success') || t.includes('fulfill')) {
    return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
  }
  if (t.includes('cancel') || t.includes('reject') || t.includes('fail') || t.includes('error')) {
    return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
  }
  if (t.includes('emergency') || t.includes('urgent') || t.includes('alert')) {
    return <Siren className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
  }
  return <Info className="h-5 w-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
}

function formatDateTime(value, lang) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const locale = lang === 'ta' ? 'ta-IN' : 'en-GB'
  return `${date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })} · ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
}

function normalizeList(payload) {
  if (Array.isArray(payload)) return { items: payload, total: payload.length }
  const items = Array.isArray(payload?.data) ? payload.data : []
  const total = typeof payload?.total === 'number' ? payload.total : items.length
  return { items, total }
}

export default function NotificationsPage() {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [limit, setLimit] = useState(PAGE_STEP)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [markingAll, setMarkingAll] = useState(false)

  const unreadOnly = tab === 'unread'

  const load = useCallback(
    async (nextLimit, { append = false } = {}) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError('')
      try {
        const res = await listNotifications({ unreadOnly, limit: nextLimit })
        const { items: list, total: serverTotal } = normalizeList(res)
        setItems(list)
        setTotal(serverTotal)
      } catch (err) {
        if (err?.status === 401) {
          navigate('/hospital/login')
          return
        }
        if (!append) {
          setItems([])
          setTotal(0)
        }
        setError(toUserMessage(err, t('notif.errLoad')))
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [unreadOnly, navigate, t],
  )

  useEffect(() => {
    load(limit, { append: limit > PAGE_STEP && items.length > 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadOnly, limit, retryKey])

  function switchTab(next) {
    if (next === tab) return
    setTab(next)
    setLimit(PAGE_STEP)
  }

  async function handleMarkAll() {
    if (markingAll) return
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      if (unreadOnly) {
        setItems([])
        setTotal(0)
      }
    } catch {
      /* silent fail — no toast on this page for mark actions */
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleOpenItem(item) {
    const id = item?.notificationId ?? item?.id
    const link = item?.link
    if (id && !item?.read) {
      setItems((prev) => prev.map((n) => ((n.notificationId ?? n.id) === id ? { ...n, read: true } : n)))
      try {
        await markNotificationRead(id)
      } catch {
        /* silent fail */
      }
      if (unreadOnly) {
        setItems((prev) => prev.filter((n) => (n.notificationId ?? n.id) !== id))
        setTotal((prev) => Math.max(0, prev - 1))
      }
    }
    if (typeof link === 'string' && link.startsWith('/')) navigate(link)
  }

  async function handleDelete(item) {
    const id = item?.notificationId ?? item?.id
    if (!id) return
    if (!window.confirm(t('notif.deleteConfirm'))) return
    setItems((prev) => prev.filter((n) => (n.notificationId ?? n.id) !== id))
    setTotal((prev) => Math.max(0, prev - 1))
    try {
      await deleteNotification(id)
    } catch {
      load(limit)
    }
  }

  const hasMore = items.length < total
  const unreadCount = items.filter((n) => !n?.read).length

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="animate-fade-in-up rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-red-700 p-5 text-white shadow-lg shadow-red-600/25 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-sm">
              <BellRing className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-wide sm:text-xl">
                {t('notif.pageTitle')}
              </h1>
              <p className="text-xs text-red-100 sm:text-sm">
                {t('notif.pageSub')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white">
              <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              {t('notif.totalBadge').replace('{count}', total)}
              {unreadCount > 0 && tab === 'all' ? ` · ${unreadCount}` : ''}
            </span>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markingAll || (tab === 'all' && unreadCount === 0) || (tab === 'unread' && items.length === 0)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition duration-200 hover:bg-red-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t('notif.markAllRead')}
            </button>
          </div>
        </div>
      </div>

      <div className="card animate-fade-in-up p-4 sm:p-5">
        <div
          role="tablist"
          aria-label={t('notif.pageTitle')}
          className="flex gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'all'}
            onClick={() => switchTab('all')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === 'all'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {t('notif.all')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'unread'}
            onClick={() => switchTab('unread')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === 'unread'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {t('notif.unread')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-red-200 border-t-red-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('notif.loading')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('notif.loadingSub')}</p>
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
            {t('notif.retry')}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-5 sm:p-6">
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 px-4 py-12 text-center dark:border-slate-700">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Bell className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {tab === 'unread' ? t('notif.emptyUnread') : t('notif.empty')}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t('notif.emptySub')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card animate-fade-in-up overflow-hidden">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => {
              const id = item?.notificationId ?? item?.id
              const clickable = typeof item?.link === 'string' && item.link.startsWith('/')
              return (
                <li key={id ?? `${item?.title}-${item?.createdAt}`}>
                  <div
                    className={`flex w-full items-start gap-2 px-4 py-4 transition sm:px-6 ${
                      item?.read
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        : 'bg-red-50/40 hover:bg-red-50/70 dark:bg-red-950/20 dark:hover:bg-red-950/30'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenItem(item)}
                      className="flex min-w-0 flex-1 items-start gap-4 text-left"
                    >
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                        {typeIcon(item?.type)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {item?.title || t('notif.untitled')}
                          </span>
                          {!item?.read && (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-600"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        {item?.body && (
                          <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
                            {item.body}
                          </span>
                        )}
                        <span className="mt-1.5 block text-xs text-slate-400 dark:text-slate-500">
                          {formatDateTime(item?.createdAt, lang)}
                        </span>
                      </span>
                      {clickable && (
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item)
                      }}
                      aria-label={t('notif.delete')}
                      title={t('notif.delete')}
                      className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          {hasMore && (
            <div className="flex justify-center border-t border-slate-100 px-4 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const next = limit + PAGE_STEP
                  setLimit(next)
                }}
                disabled={loadingMore}
                className="btn-secondary !py-2 text-xs"
              >
                {loadingMore ? t('notif.loadingMore') : t('notif.loadMore')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
