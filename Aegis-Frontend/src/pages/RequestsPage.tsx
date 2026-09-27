import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Check, CheckCheck, Eye, RefreshCw, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { BLOOD_GROUPS, DISTRICTS } from '../data/constants';
import type { BloodRequest, RequestStatus } from '../data/types';
import { listRequests, updateRequestStatusApi } from '../lib/api';
import { formatDate } from '../utils/format';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';

type Tab = 'all' | RequestStatus;

const TABS: Tab[] = ['all', 'submitted', 'approved', 'fulfilled', 'cancelled'];

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

function statusTone(status: RequestStatus): 'amber' | 'emerald' | 'sky' | 'rose' {
  if (status === 'approved') return 'emerald';
  if (status === 'fulfilled') return 'sky';
  if (status === 'cancelled') return 'rose';
  return 'amber';
}

export default function RequestsPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [requestType, setRequestType] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<BloodRequest[]>([]);
  const [counts, setCounts] = useState<Record<Tab, number>>({
    all: 0,
    submitted: 0,
    approved: 0,
    fulfilled: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BloodRequest | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const userDistrictSlug = useMemo(() => (user?.districtId ?? '').trim().toLowerCase(), [user]);

  const districtDisplay = useMemo(() => {
    if (!userDistrictSlug) return '—';
    const found = DISTRICTS.find((d) => d.toLowerCase() === userDistrictSlug);
    return found ?? user?.districtId ?? '—';
  }, [user, userDistrictSlug]);

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
        const params: {
          status?: string;
          search?: string;
          bloodGroup?: string;
          requestType?: string;
          page: number;
          limit: number;
        } = { page, limit };
        if (tab !== 'all') params.status = tab;
        if (debouncedSearch) params.search = debouncedSearch;
        if (bloodGroup) params.bloodGroup = bloodGroup;
        if (requestType) params.requestType = requestType;
        // NOTE: districtId is intentionally omitted — the server scopes by JWT.
        const res = await listRequests(params);
        if (cancelled) return;
        // Client-side assert: vera district row vandha drop pannu.
        const scoped = userDistrictSlug
          ? res.data.filter((r) => {
              const v = (r.districtId ?? '').trim().toLowerCase();
              return !v || v === userDistrictSlug;
            })
          : res.data;
        setRows(scoped);
        setTotal(res.total ?? 0);
      } catch (e) {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : t('requests.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [tab, debouncedSearch, bloodGroup, requestType, page, refreshNonce, t, userDistrictSlug]);

  // Puthu message vandha auto-refresh: 60s polling + tab focus.
  useEffect(() => {
    const id = window.setInterval(() => setRefreshNonce((n) => n + 1), 60000);
    const onFocus = () => setRefreshNonce((n) => n + 1);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function runCounts() {
      try {
        const base = {
          search: debouncedSearch || undefined,
          bloodGroup: bloodGroup || undefined,
          requestType: requestType || undefined,
          page: 1,
          limit: 1,
        };
        const [allRes, subRes, appRes, fulRes, canRes] = await Promise.all([
          listRequests(base),
          listRequests({ ...base, status: 'submitted' }),
          listRequests({ ...base, status: 'approved' }),
          listRequests({ ...base, status: 'fulfilled' }),
          listRequests({ ...base, status: 'cancelled' }),
        ]);
        if (cancelled) return;
        setCounts({
          all: allRes.total ?? 0,
          submitted: subRes.total ?? 0,
          approved: appRes.total ?? 0,
          fulfilled: fulRes.total ?? 0,
          cancelled: canRes.total ?? 0,
        });
      } catch {
        /* ignore count errors — rows carry their own total */
      }
    }
    runCounts();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, bloodGroup, requestType, refreshNonce]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const statusLabel = (s: RequestStatus): string => {
    if (s === 'submitted') return t('requests.submitted');
    if (s === 'approved') return t('requests.approved');
    if (s === 'fulfilled') return t('requests.fulfilled');
    return t('requests.cancelled');
  };

  const refetch = () => setRefreshNonce((n) => n + 1);

  const handleAction = async (row: BloodRequest, next: RequestStatus) => {
    const confirmTitle =
      next === 'approved'
        ? t('requests.confirmApprove')
        : next === 'fulfilled'
          ? t('requests.confirmFulfil')
          : t('requests.confirmCancel');
    const confirmMsg =
      next === 'approved'
        ? t('requests.confirmApproveMsg', { id: row.requestId, hospital: row.hospitalName })
        : next === 'fulfilled'
          ? t('requests.confirmFulfilMsg', { id: row.requestId })
          : t('requests.confirmCancelMsg', { id: row.requestId });
    if (!window.confirm(`${confirmTitle}\n${confirmMsg}`)) return;
    setActingId(row.requestId);
    try {
      await updateRequestStatusApi(row.requestId, next);
      if (next === 'approved') toast.success(t('requests.toastApproved', { id: row.requestId }));
      else if (next === 'fulfilled') toast.success(t('requests.toastFulfilled', { id: row.requestId }));
      else toast.success(t('requests.toastCancelled', { id: row.requestId }));
      setSelected((prev) =>
        prev && prev.requestId === row.requestId ? { ...prev, status: next } : prev,
      );
      refetch();
    } catch (e) {
      const raw = e instanceof Error ? e.message : t('requests.error');
      const lowered = raw.toLowerCase();
      if (lowered.includes('forbidden') || lowered.includes('403')) {
        toast.error(t('requests.forbidden'));
        setError(t('requests.forbidden'));
      } else if (
        lowered.includes('invalid status transition') ||
        lowered.includes('transition')
      ) {
        toast.error(t('requests.transitionError'));
      } else {
        toast.error(raw);
      }
    } finally {
      setActingId(null);
    }
  };

  const detailRow = (label: string, value: ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
    </div>
  );

  const renderActions = (row: BloodRequest) => {
    const busy = actingId === row.requestId;
    if (row.status === 'submitted') {
      return (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="success"
            icon={<Check className="h-3.5 w-3.5" />}
            loading={busy}
            onClick={() => handleAction(row, 'approved')}
          >
            {t('requests.approve')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<X className="h-3.5 w-3.5" />}
            disabled={busy}
            onClick={() => handleAction(row, 'cancelled')}
          >
            {t('requests.cancel')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => setSelected(row)}
          >
            {t('requests.view')}
          </Button>
        </div>
      );
    }
    if (row.status === 'approved') {
      return (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="primary"
            icon={<CheckCheck className="h-3.5 w-3.5" />}
            loading={busy}
            onClick={() => handleAction(row, 'fulfilled')}
          >
            {t('requests.fulfil')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<X className="h-3.5 w-3.5" />}
            disabled={busy}
            onClick={() => handleAction(row, 'cancelled')}
          >
            {t('requests.cancel')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => setSelected(row)}
          >
            {t('requests.view')}
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-end gap-1.5">
        <Button
          variant="outline"
          size="sm"
          icon={<Eye className="h-3.5 w-3.5" />}
          onClick={() => setSelected(row)}
        >
          {t('requests.view')}
        </Button>
      </div>
    );
  };

  const tabLabel = (key: Tab): string => {
    if (key === 'all') return t('requests.all');
    return statusLabel(key);
  };

  return (
    <div>
      <PageHeader
        title={t('requests.title')}
        subtitle={t('requests.subtitle')}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={refetch}
            loading={loading && rows.length > 0}
          >
            {t('requests.retry')}
          </Button>
        }
      />

      <Card className="border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40">
        <p className="text-xs font-medium text-sky-800 dark:text-sky-200">
          {t('requests.scope', { district: districtDisplay })}
        </p>
      </Card>

      <Card className="mt-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                setPage(1);
              }}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition ${
                tab === key
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {tabLabel(key)}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  tab === key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-full min-w-[180px] flex-1 sm:w-auto">
            <label
              htmlFor="request-search"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('common.search')}
            </label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="request-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t('requests.searchPlaceholder')}
                className="pl-9"
                aria-label={t('requests.searchPlaceholder')}
              />
            </div>
          </div>

          <div className="min-w-[130px] flex-1 sm:flex-none">
            <label
              htmlFor="request-group"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('requests.bloodGroup')}
            </label>
            <Select
              id="request-group"
              className="mt-1.5"
              value={bloodGroup}
              onChange={(e) => {
                setBloodGroup(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('requests.allGroups')}</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-w-[130px] flex-1 sm:flex-none">
            <label
              htmlFor="request-type"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('requests.type')}
            </label>
            <Select
              id="request-type"
              className="mt-1.5"
              value={requestType}
              onChange={(e) => {
                setRequestType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('requests.allTypes')}</option>
              <option value="emergency">{t('requests.emergency')}</option>
              <option value="normal">{t('requests.normal')}</option>
            </Select>
          </div>
        </div>
      </Card>

      <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('requests.showing', { count: rows.length, total })}
      </p>

      <Card padded={false} className="mt-3 overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('requests.loading')}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              {t('requests.retry')}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={t('requests.empty')} hint={t('requests.noResultsHint')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>{t('requests.requestId')}</th>
                    <th className={th}>{t('requests.patient')}</th>
                    <th className={th}>{t('requests.hospital')}</th>
                    <th className={th}>{t('requests.bloodGroup')}</th>
                    <th className={th}>{t('requests.units')}</th>
                    <th className={th}>{t('requests.requiredDate')}</th>
                    <th className={th}>{t('requests.type')}</th>
                    <th className={th}>{t('requests.status')}</th>
                    <th className={`${th} text-right`}>{t('requests.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {rows.map((row) => (
                    <tr
                      key={row.requestId}
                      className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        row.requestType === 'emergency'
                          ? 'border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                          : ''
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-semibold text-slate-900 dark:text-white">
                        {row.requestId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                        {row.patientName || '—'}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {row.hospitalName || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone="red">{row.bloodGroup || '—'}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {row.units}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {row.requiredDate ? formatDate(row.requiredDate, locale) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.requestType === 'emergency' ? (
                          <Badge tone="rose">{t('requests.emergency')}</Badge>
                        ) : (
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {t('requests.normal')}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
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
                  key={row.requestId}
                  className={`p-4 ${
                    row.requestType === 'emergency'
                      ? 'border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {row.requestId}
                    </span>
                    <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-white">
                    {row.patientName || '—'} · {row.hospitalName || '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="red">{row.bloodGroup || '—'}</Badge>
                    {row.requestType === 'emergency' ? (
                      <Badge tone="rose">{t('requests.emergency')}</Badge>
                    ) : (
                      <Badge tone="slate">{t('requests.normal')}</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    {t('requests.units')}: {row.units}
                    {row.requiredDate
                      ? ` · ${t('requests.requiredDate')}: ${formatDate(row.requiredDate, locale)}`
                      : ''}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{renderActions(row)}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('requests.showing', { count: rows.length, total })}
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
        title={selected?.requestId ?? ''}
        subtitle={selected?.hospitalName ?? ''}
        footer={
          <>
            {selected && selected.status === 'submitted' ? (
              <>
                <Button
                  variant="success"
                  size="sm"
                  icon={<Check className="h-3.5 w-3.5" />}
                  loading={actingId === selected.requestId}
                  onClick={() => handleAction(selected, 'approved')}
                >
                  {t('requests.approve')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<X className="h-3.5 w-3.5" />}
                  disabled={actingId === selected.requestId}
                  onClick={() => handleAction(selected, 'cancelled')}
                >
                  {t('requests.cancel')}
                </Button>
              </>
            ) : null}
            {selected && selected.status === 'approved' ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCheck className="h-3.5 w-3.5" />}
                  loading={actingId === selected.requestId}
                  onClick={() => handleAction(selected, 'fulfilled')}
                >
                  {t('requests.fulfil')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<X className="h-3.5 w-3.5" />}
                  disabled={actingId === selected.requestId}
                  onClick={() => handleAction(selected, 'cancelled')}
                >
                  {t('requests.cancel')}
                </Button>
              </>
            ) : null}
            <Button variant="outline" onClick={() => setSelected(null)}>
              {t('common.close')}
            </Button>
          </>
        }
      >
        {selected ? (
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            {detailRow(t('requests.patient'), selected.patientName || '—')}
            {detailRow(t('requests.hospital'), selected.hospitalName || '—')}
            {detailRow(t('donors.district'), selected.districtId || districtDisplay)}
            {detailRow(
              t('requests.bloodGroup'),
              <Badge tone="red">{selected.bloodGroup || '—'}</Badge>,
            )}
            {detailRow(t('requests.units'), selected.units)}
            {detailRow(
              t('requests.requiredDate'),
              selected.requiredDate ? formatDate(selected.requiredDate, locale) : '—',
            )}
            {detailRow(t('requests.contact'), selected.contact || '—')}
            {detailRow(
              t('requests.reason'),
              (selected as unknown as { reason?: unknown }).reason !== undefined &&
                (selected as unknown as { reason?: unknown }).reason !== null &&
                String((selected as unknown as { reason?: string }).reason) !== ''
                ? String((selected as unknown as { reason?: string }).reason)
                : '—',
            )}
            {detailRow(
              t('requests.priority'),
              selected.priority || selected.requestType || '—',
            )}
            {detailRow(
              t('requests.type'),
              selected.requestType === 'emergency'
                ? t('requests.emergency')
                : t('requests.normal'),
            )}
            {detailRow(
              t('requests.status'),
              <Badge tone={statusTone(selected.status)}>{statusLabel(selected.status)}</Badge>,
            )}
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
