import { Bell, BellRing, CheckCheck, CheckCircle2, Info, Siren, Trash2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/useLanguage'
import { isLoggedIn } from '../lib/auth'
import { deleteNotification, getUnreadCount, listNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/api'

const RECENT_LIMIT = 8
const POLL_MS = 60_000

function typeIcon(type) {
  const t = String(type ?? '').toLowerCase()
  if (t.includes('approv') || t.includes('success') || t.includes('fulfill')) {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
  }
  if (t.includes('cancel') || t.includes('reject') || t.includes('fail') || t.includes('error')) {
    return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
  }
  if (t.includes('emergency') || t.includes('urgent') || t.includes('alert')) {
    return <Siren className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
  }
  return <Info className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
}

function formatDate(value, lang) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function normalizeList(payload) {
  if (Array.isArray(payload)) return { items: payload, total: payload.length }
  const items = Array.isArray(payload?.data) ? payload.data : []
  const total = typeof payload?.total === 'number' ? payload.total : items.length
  return { items, total }
}

function normalizeUnread(payload) {
  if (typeof payload === 'number') return payload
  const n = payload?.unread ?? payload?.count ?? 0
  const parsed = Number(n)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export default function NotificationBell() {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [markingAll, setMarkingAll] = useState(false)
  const wrapRef = useRef(null)

  const authed = isLoggedIn()

  const refresh = useCallback(async () => {
    if (!isLoggedIn()) return
    try {
      const [listRes, countRes] = await Promise.all([
        listNotifications({ limit: RECENT_LIMIT }),
        getUnreadCount(),
      ])
      const { items: list } = normalizeList(listRes)
      setItems(list)
      setUnread(normalizeUnread(countRes))
    } catch {
      /* silent fail — backend may be unreachable */
    }
  }, [])

  useEffect(() => {
    if (!authed) return
    refresh()
    const id = setInterval(refresh, POLL_MS)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [authed, refresh])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open ])

  if (!authed) return null

  async function handleOpenItem(item) {
    const id = item?.notificationId ?? item?.id
    const link = item?.link
    if (id && !item?.read) {
      setItems((prev) => prev.map((n) => ((n.notificationId ?? n.id) === id ? { ...n, read: true } : n)))
      setUnread((prev) => Math.max(0, prev - 1))
      try {
        await markNotificationRead(id)
      } catch {
        /* silent fail */
      }
    }
    setOpen(false)
    if (typeof link === 'string' && link.startsWith('/')) navigate(link)
  }

  async function handleMarkAll() {
    if (markingAll || unread === 0) return
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnread(0)
    } catch {
      /* silent fail */
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleDelete(item) {
    const id = item?.notificationId ?? item?.id
    if (!id) return
    const wasUnread = !item?.read
    setItems((prev) => prev.filter((n) => (n.notificationId ?? n.id) !== id))
    if (wasUnread) setUnread((prev) => Math.max(0, prev - 1))
    try {
      await deleteNotification(id)
    } catch {
      refresh()
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev)
          if (!open) refresh()
        }}
        aria-label={t('nav.notifications')}
        title={t('nav.notifications')}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {unread > 0 ? (
          <BellRing className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Bell className="h-5 w-5" aria-hidden="true" />
        )}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm shadow-red-600/40">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] animate-scale-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40 sm:w-96">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {t('notif.recent')}
            </p>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markingAll || unread === 0}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:text-red-300"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t('notif.markAllRead')}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <Bell className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t('notif.empty')}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t('notif.emptySub')}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => {
                  const id = item?.notificationId ?? item?.id
                  return (
                    <li key={id ?? `${item?.title}-${item?.createdAt}`}>
                      <div className="flex items-start gap-1 px-4 py-3 transition hover:bg-red-50/40 dark:hover:bg-red-950/20">
                        <button
                          type="button"
                          onClick={() => handleOpenItem(item)}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            {typeIcon(item?.type)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
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
                              <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500 dark:text-slate-400">
                                {item.body}
                              </span>
                            )}
                            {item?.createdAt && (
                              <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">
                                {formatDate(item.createdAt, lang)}
                              </span>
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(item)
                          }}
                          aria-label={t('notif.delete')}
                          title={t('notif.delete')}
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-center text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:border-slate-800 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          >
            {t('notif.viewAll')}
          </Link>
        </div>
      )}
    </div>
  )
}
