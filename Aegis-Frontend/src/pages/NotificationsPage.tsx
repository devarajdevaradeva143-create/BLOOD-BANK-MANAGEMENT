import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, CheckCheck, Eye, RefreshCw, Search } from 'lucide-react';
import type { BloodUnit, Message } from '../data/types';
import { listMessages, listNotifications, markNotificationRead } from '../lib/api';
import type { AppNotification } from '../lib/api';
import { useUnits } from '../context/UnitContext';
import { useI18n } from '../i18n/I18nContext';
import { daysRemaining, isEffectivelyExpired, isExpiringSoon } from '../utils/expiry';
import { formatDateTime } from '../utils/format';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';

type Filter = 'all' | 'unread';

function typeTone(type: string): 'amber' | 'red' | 'sky' | 'slate' | 'emerald' {
  const t = type.toLowerCase();
  if (t.includes('expir')) return 'amber';
  if (t.includes('fail') || t.includes('alert') || t.includes('urgent')) return 'red';
  if (t.includes('message') || t.includes('reply')) return 'sky';
  if (t.includes('success') || t.includes('approv')) return 'emerald';
  return 'slate';
}

function typeLabel(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('expir')) return 'Expiry';
  if (t.includes('fail') || t === 'test') return 'Testing';
  if (t.includes('message') || t.includes('reply')) return 'Message';
  return type || 'Info';
}

function derivedFromUnits(units: BloodUnit[]): AppNotification[] {
  const out: AppNotification[] = [];
  for (const unit of units) {
    if (isExpiringSoon(unit)) {
      const days = daysRemaining(unit.expiryDate);
      out.push({
        id: `local-expiring-${unit.id}`,
        type: 'expiry',
        title: `Unit ${unit.id} expiring soon`,
        body: `${unit.bloodGroup} ${unit.component} expires in ${days} day${days === 1 ? '' : 's'} (${unit.expiryDate}). Stored at ${unit.storageLocation || unit.district || 'blood bank'}.`,
        link: '/expiry',
        read: false,
        createdAt: unit.updatedAt,
      });
    }
    if (unit.testStatus === 'Failed') {
      out.push({
        id: `local-failed-${unit.id}`,
        type: 'test',
        title: `Unit ${unit.id} failed screening`,
        body: `${unit.bloodGroup} ${unit.component} failed testing${unit.screeningResult ? `: ${unit.screeningResult}` : ''}. Review it on the Testing page.`,
        link: '/testing',
        read: false,
        createdAt: unit.updatedAt,
      });
    }
    if (isEffectivelyExpired(unit)) {
      out.push({
        id: `local-expired-${unit.id}`,
        type: 'expiry',
        title: `Unit ${unit.id} expired`,
        body: `${unit.bloodGroup} ${unit.component} expired on ${unit.expiryDate}. Please discard or update its status.`,
        link: '/expiry',
        read: false,
        createdAt: unit.updatedAt,
      });
    }
  }
  return out;
}

function derivedFromReplies(messages: Message[]): AppNotification[] {
  return messages
    .filter((m) => m.reply)
    .map((m) => ({
      id: `local-reply-${m.messageId}`,
      type: 'message',
      title: `Reply: ${m.subject || m.messageId}`,
      body: String(m.reply ?? ''),
      link: '/messages',
      read: m.status !== 'unread',
      createdAt: m.createdAt ?? new Date().toISOString(),
    }));
}

export default function NotificationsPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const { units } = useUnits();

  const [serverRows, setServerRows] = useState<AppNotification[]>([]);
  const [replies, setReplies] = useState<Message[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      // Server notifications are best-effort: any failure falls back to
      // locally derived alerts so the page never crashes offline.
      try {
        const res = await listNotifications({ page: 1, limit: 100 });
        if (!cancelled) setServerRows(res.data);
      } catch {
        if (!cancelled) setServerRows([]);
      }
      try {
        const res = await listMessages({ page: 1, limit: 50 });
        if (!cancelled) setReplies(res.data);
      } catch {
        if (!cancelled) setReplies([]);
      }
      if (!cancelled) setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [refreshNonce]);

  // 60s polling + tab focus, mirroring MessagesPage.
  useEffect(() => {
    const id = window.setInterval(() => setRefreshNonce((n) => n + 1), 60000);
    const onFocus = () => setRefreshNonce((n) => n + 1);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const merged = useMemo(() => {
    const derived: AppNotification[] = [
      ...derivedFromUnits(units),
      ...derivedFromReplies(replies),
    ];
    const all = [...serverRows, ...derived].map((n) => ({
      ...n,
      read: n.read || readIds.has(n.id),
    }));
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all;
  }, [serverRows, units, replies, readIds]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return merged.filter((n) => {
      if (filter === 'unread' && n.read) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q)
      );
    });
  }, [merged, debouncedSearch, filter]);

  const unreadCount = useMemo(() => merged.filter((n) => !n.read).length, [merged]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * limit, safePage * limit);

  const refetch = () => setRefreshNonce((n) => n + 1);

  const markRead = (n: AppNotification) => {
    setReadIds((prev) => new Set(prev).add(n.id));
    if (!n.id.startsWith('local-')) {
      // Fire-and-forget: local state already marks it read offline.
      markNotificationRead(n.id).catch(() => undefined);
    }
    if (selected?.id === n.id) setSelected({ ...n, read: true });
  };

  const handleOpen = (n: AppNotification) => {
    setSelected(n);
    if (!n.read) markRead(n);
  };

  const handleMarkAllRead = async () => {
    const unread = merged.filter((n) => !n.read);
    if (unread.length === 0) return;
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const n of unread) next.add(n.id);
      return next;
    });
    if (selected) setSelected({ ...selected, read: true });
    const serverIds = unread.filter((n) => !n.id.startsWith('local-')).map((n) => n.id);
    await Promise.allSettled(serverIds.map((id) => markNotificationRead(id)));
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Alerts about expiring units, test results, and message replies"
        action={
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <Badge tone="red">{unreadCount} unread</Badge>
            ) : (
              <Badge tone="emerald">All read</Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={<CheckCheck className="h-3.5 w-3.5" />}
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={refetch}
              loading={loading && merged.length > 0}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader title="All notifications" subtitle={`${filtered.length} notification${filtered.length === 1 ? '' : 's'}`} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="notification-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search notifications"
              className="pl-9"
              aria-label="Search notifications"
            />
          </div>
          <div className="flex items-center gap-2" role="tablist" aria-label="Filter notifications">
            <Button
              variant={filter === 'all' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => {
                setFilter('all');
                setPage(1);
              }}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => {
                setFilter('unread');
                setPage(1);
              }}
            >
              Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Button>
          </div>
        </div>
      </Card>

      <Card padded={false} className="mt-3 overflow-hidden">
        {loading && merged.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">Loading notifications...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-7 w-7" />}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            hint={
              filter === 'unread'
                ? 'You are all caught up.'
                : 'Expiring units, failed tests, and message replies will appear here.'
            }
            action={
              <Button variant="outline" size="sm" onClick={refetch}>
                Refresh
              </Button>
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {paged.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleOpen(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      n.read ? '' : 'bg-amber-50/40 dark:bg-amber-950/20'
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-200 dark:bg-slate-700' : 'bg-red-500'}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge tone={typeTone(n.type)}>{typeLabel(n.type)}</Badge>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {n.title || 'Notification'}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-sm text-slate-600 dark:text-slate-400">
                        {n.body || '—'}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(n.createdAt, locale)}
                      </span>
                    </span>
                    <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-slate-400 sm:inline-flex">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Showing {paged.length} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Back
                </Button>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Notification'}
        subtitle={selected ? formatDateTime(selected.createdAt, locale) : undefined}
        footer={
          <>
            {selected?.link ? (
              <Button
                variant="primary"
                onClick={() => {
                  const link = selected.link as string;
                  setSelected(null);
                  navigate(link);
                }}
              >
                View
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <Badge tone={typeTone(selected.type)}>{typeLabel(selected.type)}</Badge>
            <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
              {selected.body || '—'}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
