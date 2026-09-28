import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Check, CheckCheck, Eye, Search, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { listRequests, updateRequestStatusApi } from '../../lib/api';
import type { BloodRequest, RequestStatus } from '../../data/types';
import { DISTRICTS } from '../../data/constants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

type Tab = 'all' | 'submitted' | 'approved' | 'cancelled';
type PriorityFilter = 'all' | 'emergency' | 'normal';

const PAGE_SIZE = 10;

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

function statusTone(status: RequestStatus): 'amber' | 'emerald' | 'sky' | 'rose' {
  if (status === 'approved') return 'emerald';
  if (status === 'fulfilled') return 'sky';
  if (status === 'cancelled') return 'rose';
  return 'amber';
}

function districtDisplay(districtId: string): string {
  const slug = (districtId ?? '').trim().toLowerCase();
  if (!slug) return '—';
  return DISTRICTS.find((d) => d.toLowerCase() === slug) ?? districtId;
}

export default function RequestsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<BloodRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<Tab, number>>({
    all: 0,
    submitted: 0,
    approved: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BloodRequest | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
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
        const res = await listRequests({
          status: tab === 'all' ? undefined : tab,
          search: debouncedSearch || undefined,
          districtId: district || undefined,
          requestType: priority === 'all' ? undefined : priority,
          page,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        setRows(res.data ?? []);
        setTotal(res.total ?? 0);
      } catch (e) {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [tab, debouncedSearch, district, priority, page, refreshNonce, t]);

  useEffect(() => {
    let cancelled = false;
    async function runCounts() {
      try {
        const base = {
          search: debouncedSearch || undefined,
          districtId: district || undefined,
          requestType: priority === 'all' ? undefined : priority,
          page: 1,
          limit: 1,
        };
        const [allRes, subRes, appRes, canRes] = await Promise.all([
          listRequests(base),
          listRequests({ ...base, status: 'submitted' }),
          listRequests({ ...base, status: 'approved' }),
          listRequests({ ...base, status: 'cancelled' }),
        ]);
        if (cancelled) return;
        setCounts({
          all: allRes.total ?? 0,
          submitted: subRes.total ?? 0,
          approved: appRes.total ?? 0,
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
  }, [debouncedSearch, district, priority, refreshNonce]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const refetch = () => setRefreshNonce((n) => n + 1);

  const statusLabel = (s: RequestStatus): string => {
    if (s === 'submitted') return t('admin.requests.pending');
    if (s === 'approved') return t('admin.requests.approved');
    if (s === 'cancelled') return t('admin.requests.rejected');
    return 'Fulfilled';
  };

  const handleAction = async (row: BloodRequest, next: 'approved' | 'fulfilled' | 'cancelled') => {
    if (actingId) return;
    setActingId(row.requestId);
    try {
      const updated = await updateRequestStatusApi(row.requestId, next);
      toast.success(`${row.requestId} · ${statusLabel(updated.status)}`);
      setSelected((prev) =>
        prev && prev.requestId === row.requestId ? updated : prev,
      );
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setActingId(null);
    }
  };

  const emergencyBadge = (
    <Badge tone="rose" className="mt-1">
      {t('admin.requests.emergency')}
    </Badge>
  );

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
          <Button size="sm" variant="success" icon={<Check className="h-3.5 w-3.5" />} loading={busy} onClick={() => handleAction(row, 'approved')}>
            Approve
          </Button>
          <Button size="sm" variant="danger" icon={<X className="h-3.5 w-3.5" />} disabled={busy} onClick={() => handleAction(row, 'cancelled')}>
            Cancel
          </Button>
          <Button variant="outline" size="sm" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setSelected(row)}>
            {t('admin.table.view')}
          </Button>
        </div>
      );
    }
    if (row.status === 'approved') {
      return (
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="primary" icon={<CheckCheck className="h-3.5 w-3.5" />} loading={busy} onClick={() => handleAction(row, 'fulfilled')}>
            Fulfil
          </Button>
          <Button size="sm" variant="danger" icon={<X className="h-3.5 w-3.5" />} disabled={busy} onClick={() => handleAction(row, 'cancelled')}>
            Cancel
          </Button>
          <Button variant="outline" size="sm" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setSelected(row)}>
            {t('admin.table.view')}
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="outline" size="sm" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setSelected(row)}>
          {t('admin.table.view')}
        </Button>
      </div>
    );
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: t('admin.table.allStatus'), count: counts.all },
    { key: 'submitted', label: t('admin.requests.pending'), count: counts.submitted },
    { key: 'approved', label: t('admin.requests.approved'), count: counts.approved },
    { key: 'cancelled', label: t('admin.requests.rejected'), count: counts.cancelled },
  ];

  return (
    <div>
      <PageHeader title={t('admin.requests.title')} subtitle={t('admin.requests.subtitle')} />

      <Card>
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setTab(item.key);
                setPage(1);
              }}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition ${
                tab === item.key
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  tab === item.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {item.count}
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
                placeholder={t('admin.table.searchPh')}
                className="pl-9"
                aria-label={t('admin.table.searchPh')}
              />
            </div>
          </div>

          <div className="min-w-[150px] flex-1 sm:flex-none">
            <label
              htmlFor="request-district"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('admin.donors.district')}
            </label>
            <Select
              id="request-district"
              className="mt-1.5"
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('admin.table.allDistricts')}</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-w-[150px] flex-1 sm:flex-none">
            <label
              htmlFor="request-priority"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('admin.requests.type')}
            </label>
            <Select
              id="request-priority"
              className="mt-1.5"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as PriorityFilter);
                setPage(1);
              }}
            >
              <option value="all">{t('admin.table.allStatus')}</option>
              <option value="emergency">{t('admin.requests.emergency')}</option>
              <option value="normal">{t('admin.requests.normal')}</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card padded={false} className="mt-4 overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              {t('admin.messages.retry')}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={t('admin.table.noResults')} hint={t('admin.table.noResultsHint')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>{t('admin.requests.requestId')}</th>
                    <th className={th}>{t('admin.requests.hospital')}</th>
                    <th className={th}>{t('admin.donors.district')}</th>
                    <th className={th}>{t('admin.requests.group')}</th>
                    <th className={th}>{t('admin.requests.units')}</th>
                    <th className={th}>{t('admin.requests.date')}</th>
                    <th className={th}>{t('common.status')}</th>
                    <th className={`${th} text-right`}>{t('admin.table.actions')}</th>
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
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="block font-mono text-sm font-semibold text-slate-900 dark:text-white">
                          {row.requestId}
                        </span>
                        {row.requestType === 'emergency' ? emergencyBadge : null}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                        {row.hospitalName || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {districtDisplay(row.districtId)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone="red">{row.bloodGroup || '—'}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {row.units}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {row.requiredDate || (row.createdAt ? row.createdAt.slice(0, 10) : '—')}
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
                  {row.requestType === 'emergency' ? <div>{emergencyBadge}</div> : null}
                  <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-white">
                    {row.hospitalName || '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="red">{row.bloodGroup || '—'}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    {districtDisplay(row.districtId)} · {t('admin.requests.units')}: {row.units} ·{' '}
                    {t('admin.requests.date')}:{' '}
                    {row.requiredDate || (row.createdAt ? row.createdAt.slice(0, 10) : '—')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{renderActions(row)}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('admin.table.showing', { count: rows.length, total })}
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
        title={selected?.requestId ?? ''}
        subtitle={selected?.hospitalName ?? ''}
        footer={
          <Button variant="outline" onClick={() => setSelected(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {selected ? (
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            {detailRow(t('admin.requests.hospital'), selected.hospitalName || '—')}
            {detailRow(t('admin.donors.district'), districtDisplay(selected.districtId))}
            {detailRow(t('admin.requests.group'), <Badge tone="red">{selected.bloodGroup || '—'}</Badge>)}
            {detailRow(t('admin.requests.units'), selected.units)}
            {detailRow(
              t('admin.requests.date'),
              selected.requiredDate || (selected.createdAt ? selected.createdAt.slice(0, 10) : '—'),
            )}
            {detailRow(
              t('admin.requests.type'),
              selected.requestType === 'emergency' ? (
                <Badge tone="rose">{t('admin.requests.emergency')}</Badge>
              ) : (
                t('admin.requests.normal')
              ),
            )}
            {detailRow(
              t('common.status'),
              <Badge tone={statusTone(selected.status)}>{statusLabel(selected.status)}</Badge>,
            )}
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
