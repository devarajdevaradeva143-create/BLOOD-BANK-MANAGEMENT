import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { CheckCheck, Eye, RefreshCw, Reply, Search } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { DISTRICTS } from '../../data/constants';
import { listDistrictMessages, markMessageRead, replyToMessage } from '../../lib/api';
import type { Message as MessageRow } from '../../data/types';
import { formatDateTime } from '../../utils/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

type MessageStatus = 'unread' | 'read' | 'replied';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | MessageStatus;

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

function statusTone(status: MessageStatus): 'amber' | 'sky' | 'emerald' {
  if (status === 'replied') return 'emerald';
  if (status === 'read') return 'sky';
  return 'amber';
}

export default function MessagesPage() {
  const { t, locale } = useI18n();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MessageRow | null>(null);
  const [reply, setReply] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [list, unread] = await Promise.all([
          listDistrictMessages({
            districtId: districtId || undefined,
            status: status === 'all' ? undefined : status,
            search: debouncedSearch || undefined,
            page,
            limit: PAGE_SIZE,
          }),
          listDistrictMessages({ status: 'unread', page: 1, limit: 1 }).catch(() => ({
            data: [],
            total: 0,
          })),
        ]);
        if (cancelled) return;
        setRows(list.data);
        setTotal(list.total ?? 0);
        setUnreadCount(unread.total ?? 0);
      } catch (e) {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : t('admin.messages.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, districtId, status, page, refreshNonce, t]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusLabel = (s: MessageStatus): string => {
    if (s === 'replied') return t('admin.messages.replied');
    if (s === 'read') return t('admin.messages.read');
    return t('admin.messages.unread');
  };

  const refetch = () => setRefreshNonce((n) => n + 1);

  const openDetail = (row: MessageRow) => {
    setSelected(row);
    setReply('');
  };

  const handleMarkRead = async (row: MessageRow) => {
    if (row.status !== 'unread' || markingId) return;
    setMarkingId(row.messageId);
    try {
      await markMessageRead(row.messageId);
      setRows((prev) =>
        prev.map((r) => (r.messageId === row.messageId ? { ...r, status: 'read' as const } : r)),
      );
      setSelected((prev) =>
        prev && prev.messageId === row.messageId ? { ...prev, status: 'read' as const } : prev,
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('admin.messages.error'));
    } finally {
      setMarkingId(null);
    }
  };

  const handleSendReply = async () => {
    const trimmed = reply.trim();
    if (!selected || !trimmed || replySending) return;
    setReplySending(true);
    try {
      await replyToMessage(selected.messageId, trimmed);
      const wasUnread = selected.status === 'unread';
      const updated: MessageRow = { ...selected, status: 'replied', reply: trimmed };
      setRows((prev) => prev.map((r) => (r.messageId === updated.messageId ? updated : r)));
      setSelected(updated);
      setReply('');
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      toast.success(t('admin.messages.replySent'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('admin.messages.error'));
    } finally {
      setReplySending(false);
    }
  };

  const detailRow = (label: string, value: ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
    </div>
  );

  const renderActions = (row: MessageRow) => (
    <div className="flex items-center justify-end gap-1.5">
      {row.status === 'unread' ? (
        <Button
          variant="outline"
          size="sm"
          icon={<CheckCheck className="h-3.5 w-3.5" />}
          loading={markingId === row.messageId}
          onClick={() => handleMarkRead(row)}
        >
          {t('admin.messages.markRead')}
        </Button>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        icon={<Reply className="h-3.5 w-3.5" />}
        onClick={() => openDetail(row)}
      >
        {t('admin.messages.reply')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        icon={<Eye className="h-3.5 w-3.5" />}
        onClick={() => openDetail(row)}
      >
        {t('admin.messages.view')}
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={t('admin.messages.title')}
        subtitle={t('admin.messages.subtitle')}
        action={
          <>
            {unreadCount > 0 ? (
              <Badge tone="rose" dot>
                {unreadCount} · {t('admin.messages.unread')}
              </Badge>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={refetch}
              loading={loading && rows.length > 0}
            >
              {t('admin.messages.retry')}
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full min-w-[180px] flex-1 sm:w-auto">
            <label
              htmlFor="superadmin-message-search"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('common.search')}
            </label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="superadmin-message-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t('admin.messages.searchPlaceholder')}
                className="pl-9"
                aria-label={t('admin.messages.searchPlaceholder')}
              />
            </div>
          </div>

          <div className="min-w-[150px] flex-1 sm:flex-none">
            <label
              htmlFor="superadmin-message-district"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('admin.messages.district')}
            </label>
            <Select
              id="superadmin-message-district"
              className="mt-1.5"
              value={districtId}
              onChange={(e) => {
                setDistrictId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('admin.messages.allDistricts')}</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-w-[150px] flex-1 sm:flex-none">
            <label
              htmlFor="superadmin-message-status"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('common.status')}
            </label>
            <Select
              id="superadmin-message-status"
              className="mt-1.5"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <option value="all">{t('admin.table.allStatus')}</option>
              <option value="unread">{t('admin.messages.unread')}</option>
              <option value="read">{t('admin.messages.read')}</option>
              <option value="replied">{t('admin.messages.replied')}</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card padded={false} className="mt-4 overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('admin.messages.loading')}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {t('admin.messages.error')}: {error}
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              {t('admin.messages.retry')}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={t('admin.messages.empty')} hint={t('admin.table.noResultsHint')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>ID</th>
                    <th className={th}>{t('admin.donors.name')}</th>
                    <th className={th}>{t('admin.messages.district')}</th>
                    <th className={th}>{t('messages.subject')}</th>
                    <th className={th}>{t('common.status')}</th>
                    <th className={th}>{t('admin.requests.date')}</th>
                    <th className={`${th} text-right`}>{t('admin.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {rows.map((row) => (
                    <tr
                      key={row.messageId}
                      className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        row.status === 'unread'
                          ? 'border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                          : ''
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-semibold text-slate-900 dark:text-white">
                        {row.messageId}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                        {row.fromName || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {row.fromDistrictId || '—'}
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {row.subject || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {row.createdAt ? formatDateTime(row.createdAt, locale) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{renderActions(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {rows.map((row) => (
                <div
                  key={row.messageId}
                  className={`p-4 ${
                    row.status === 'unread'
                      ? 'border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {row.messageId}
                    </span>
                    <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-medium text-slate-900 dark:text-white">
                    {row.subject || '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {row.fromName || '—'} · {row.fromDistrictId || '—'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
                    {row.createdAt ? formatDateTime(row.createdAt, locale) : '—'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{renderActions(row)}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('admin.messages.showing', { count: rows.length, total })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t('common.back')}
                </Button>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label={`${page + 1} / ${totalPages}`}
                >
                  ›
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.subject || selected?.messageId || ''}
        subtitle={selected?.messageId ?? ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              loading={replySending}
              disabled={!reply.trim() || !selected}
              onClick={handleSendReply}
            >
              {t('admin.messages.sendReply')}
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-5">
            <dl className="divide-y divide-slate-100 dark:divide-slate-800">
              {detailRow(t('admin.donors.name'), selected.fromName || '—')}
              {detailRow(t('admin.messages.district'), selected.fromDistrictId || '—')}
              {detailRow(
                t('admin.requests.date'),
                selected.createdAt ? formatDateTime(selected.createdAt, locale) : '—',
              )}
              {detailRow(
                t('common.status'),
                <Badge tone={statusTone(selected.status)}>{statusLabel(selected.status)}</Badge>,
              )}
            </dl>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('messages.subject')}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                {selected.subject || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('messages.body')}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                {selected.body || '—'}
              </p>
            </div>
            {selected.reply ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t('admin.messages.replied')}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                  {selected.reply}
                </p>
              </div>
            ) : null}
            <Field label={t('admin.messages.reply')} htmlFor="superadmin-reply-textarea">
              <Textarea
                id="superadmin-reply-textarea"
                value={reply}
                rows={4}
                maxLength={2000}
                onChange={(e) => setReply(e.target.value)}
                placeholder={t('admin.messages.replyPlaceholder')}
                aria-label={t('admin.messages.replyPlaceholder')}
              />
            </Field>
            {selected.status === 'unread' ? (
              <Button
                variant="outline"
                size="sm"
                icon={<CheckCheck className="h-3.5 w-3.5" />}
                loading={markingId === selected.messageId}
                onClick={() => handleMarkRead(selected)}
              >
                {t('admin.messages.markRead')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
