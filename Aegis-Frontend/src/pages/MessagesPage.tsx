import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, RefreshCw, Search, Send } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { Message, MessageStatus } from '../data/types';
import { listMessages, sendMessage } from '../lib/api';
import { formatDateTime } from '../utils/format';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field, Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

function statusTone(status: MessageStatus): 'amber' | 'sky' | 'emerald' {
  if (status === 'replied') return 'emerald';
  if (status === 'read') return 'sky';
  return 'amber';
}

export default function MessagesPage() {
  const { t, locale } = useI18n();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Message | null>(null);
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
        const res = await listMessages({
          search: debouncedSearch || undefined,
          page,
          limit,
        });
        if (cancelled) return;
        setRows(res.data);
        setTotal(res.total ?? 0);
      } catch (e) {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : t('messages.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, page, refreshNonce, t]);

  // Puthu reply vandha auto-refresh: 60s polling + tab focus.
  useEffect(() => {
    const id = window.setInterval(() => setRefreshNonce((n) => n + 1), 60000);
    const onFocus = () => setRefreshNonce((n) => n + 1);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const statusLabel = (s: MessageStatus): string => {
    if (s === 'replied') return t('messages.statusReplied');
    if (s === 'read') return t('messages.statusRead');
    return t('messages.statusUnread');
  };

  const refetch = () => setRefreshNonce((n) => n + 1);

  const handleSend = async () => {
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    let valid = true;
    if (trimmedSubject.length < 3) {
      setSubjectError(t('validation.required'));
      valid = false;
    } else {
      setSubjectError(null);
    }
    if (!trimmedBody) {
      setBodyError(t('validation.required'));
      valid = false;
    } else {
      setBodyError(null);
    }
    if (!valid) return;
    setSending(true);
    try {
      await sendMessage({ subject: trimmedSubject, body: trimmedBody });
      toast.success(t('messages.sent'));
      setSubject('');
      setBody('');
      setPage(1);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('messages.error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('messages.title')}
        subtitle={t('messages.subtitle')}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={refetch}
            loading={loading && rows.length > 0}
          >
            {t('messages.retry')}
          </Button>
        }
      />

      <Card>
        <CardHeader title={t('messages.compose')} subtitle={t('messages.subtitle')} />
        <div className="space-y-4">
          <Field label={t('messages.subject')} htmlFor="message-subject" error={subjectError ?? undefined} required>
            <Input
              id="message-subject"
              value={subject}
              maxLength={120}
              onChange={(e) => {
                setSubject(e.target.value);
                if (subjectError) setSubjectError(null);
              }}
              placeholder={t('messages.subject')}
              error={subjectError ?? undefined}
              aria-label={t('messages.subject')}
            />
          </Field>
          <Field
            label={t('messages.body')}
            htmlFor="message-body"
            error={bodyError ?? undefined}
            hint={`${body.length}/2000`}
            required
          >
            <Textarea
              id="message-body"
              value={body}
              rows={4}
              maxLength={2000}
              onChange={(e) => {
                setBody(e.target.value);
                if (bodyError) setBodyError(null);
              }}
              placeholder={t('messages.body')}
              error={bodyError ?? undefined}
              aria-label={t('messages.body')}
            />
          </Field>
          <Button
            variant="primary"
            icon={<Send className="h-3.5 w-3.5" />}
            loading={sending}
            onClick={handleSend}
          >
            {sending ? t('messages.sending') : t('messages.send')}
          </Button>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title={t('messages.listTitle')} />
        <div className="relative mt-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="message-search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('messages.searchPlaceholder')}
            className="pl-9"
            aria-label={t('messages.searchPlaceholder')}
          />
        </div>
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('messages.showing', { count: rows.length, total })}
        </p>
      </Card>

      <Card padded={false} className="mt-3 overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('messages.loading')}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              {t('messages.retry')}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={t('messages.empty')} hint={t('messages.emptyHint')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>ID</th>
                    <th className={th}>{t('messages.subject')}</th>
                    <th className={th}>{t('common.status')}</th>
                    <th className={th}>{t('messages.date')}</th>
                    <th className={`${th} text-right`}>{t('messages.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {rows.map((row) => (
                    <tr key={row.messageId} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-semibold text-slate-900 dark:text-white">
                        {row.messageId}
                      </td>
                      <td className="max-w-[320px] truncate px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                        {row.subject || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {row.createdAt ? formatDateTime(row.createdAt, locale) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="h-3.5 w-3.5" />}
                          onClick={() => setSelected(row)}
                        >
                          {t('messages.view')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {rows.map((row) => (
                <div key={row.messageId} className="p-4">
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
                    {row.createdAt ? formatDateTime(row.createdAt, locale) : '—'}
                  </p>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Eye className="h-3.5 w-3.5" />}
                      onClick={() => setSelected(row)}
                    >
                      {t('messages.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('messages.showing', { count: rows.length, total })}
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
                >
                  {page >= totalPages ? `${page} / ${totalPages}` : `${page + 1} / ${totalPages}`}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.subject ?? ''}
        subtitle={selected?.messageId ?? ''}
        footer={
          <Button variant="outline" onClick={() => setSelected(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {selected ? (
          <div className="space-y-5">
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
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('messages.replyTitle')}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                {selected.reply ? (
                  selected.reply
                ) : (
                  <span className="italic text-slate-400 dark:text-slate-500">
                    {t('messages.noReply')}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone={statusTone(selected.status)}>{statusLabel(selected.status)}</Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selected.createdAt ? formatDateTime(selected.createdAt, locale) : '—'}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('messages.subtitle')}</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
