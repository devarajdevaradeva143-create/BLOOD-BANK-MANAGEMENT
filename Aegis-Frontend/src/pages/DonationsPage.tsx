import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Check, CheckCheck, Eye, RefreshCw, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { BLOOD_GROUPS, DISTRICTS } from '../data/constants';
import type { Donation, DonationStatus } from '../data/types';
import { listDonations, updateDonationStatusApi } from '../lib/api';
import { formatDate } from '../utils/format';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';

type Tab = 'all' | DonationStatus;

const TABS: Tab[] = ['all', 'pending', 'approved', 'completed', 'cancelled'];

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

function statusTone(status: DonationStatus): 'amber' | 'emerald' | 'sky' | 'rose' {
  if (status === 'approved') return 'emerald';
  if (status === 'completed') return 'sky';
  if (status === 'cancelled') return 'rose';
  return 'amber';
}

export default function DonationsPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<Donation[]>([]);
  const [counts, setCounts] = useState<Record<Tab, number>>({
    all: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Donation | null>(null);
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
          page: number;
          limit: number;
        } = { page, limit };
        if (tab !== 'all') params.status = tab;
        if (debouncedSearch) params.search = debouncedSearch;
        if (bloodGroup) params.bloodGroup = bloodGroup;
        // NOTE: districtId is intentionally omitted — the server scopes by JWT.
        const res = await listDonations(params);
        if (cancelled) return;
        // Client-side assert: vera district row vandha drop pannu.
        const scoped = userDistrictSlug
          ? res.data.filter((d) => {
              const v = (d.districtId ?? '').trim().toLowerCase();
              return !v || v === userDistrictSlug;
            })
          : res.data;
        setRows(scoped);
        setTotal(res.total ?? 0);
      } catch (e) {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : t('donations.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [tab, debouncedSearch, bloodGroup, page, refreshNonce, t, userDistrictSlug]);

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
          page: 1,
          limit: 1,
        };
        const [allRes, penRes, appRes, comRes, canRes] = await Promise.all([
          listDonations(base),
          listDonations({ ...base, status: 'pending' }),
          listDonations({ ...base, status: 'approved' }),
          listDonations({ ...base, status: 'completed' }),
          listDonations({ ...base, status: 'cancelled' }),
        ]);
        if (cancelled) return;
        setCounts({
          all: allRes.total ?? 0,
          pending: penRes.total ?? 0,
          approved: appRes.total ?? 0,
          completed: comRes.total ?? 0,
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
  }, [debouncedSearch, bloodGroup, refreshNonce]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const statusLabel = (s: DonationStatus): string => {
    if (s === 'pending') return t('donations.pending');
    if (s === 'approved') return t('donations.approved');
    if (s === 'completed') return t('donations.completed');
    return t('donations.cancelled');
  };

  const refetch = () => setRefreshNonce((n) => n + 1);

  const handleAction = async (row: Donation, next: DonationStatus) => {
    const confirmTitle =
      next === 'approved'
        ? t('donations.confirmApprove')
        : next === 'completed'
          ? t('donations.confirmComplete')
          : t('donations.confirmCancel');
    const confirmMsg =
      next === 'approved'
        ? t('donations.confirmApproveMsg', { id: row.donationId })
        : next === 'completed'
          ? t('donations.confirmCompleteMsg', { id: row.donationId })
          : t('donations.confirmCancelMsg', { id: row.donationId });
    if (!window.confirm(`${confirmTitle}\n${confirmMsg}`)) return;
    setActingId(row.donationId);
    try {
      await updateDonationStatusApi(row.donationId, next);
      if (next === 'approved') toast.success(t('donations.toastApproved', { id: row.donationId }));
      else if (next === 'completed')
        toast.success(t('donations.toastCompleted', { id: row.donationId }));
      else toast.success(t('donations.toastCancelled', { id: row.donationId }));
      setSelected((prev) =>
        prev && prev.donationId === row.donationId ? { ...prev, status: next } : prev,
      );
      refetch();
    } catch (e) {
      const raw = e instanceof Error ? e.message : t('donations.error');
      const lowered = raw.toLowerCase();
      if (lowered.includes('forbidden') || lowered.includes('403')) {
        toast.error(t('donations.forbidden'));
        setError(t('donations.forbidden'));
      } else if (
        lowered.includes('invalid status transition') ||
        lowered.includes('transition')
      ) {
        toast.error(t('donations.transitionError'));
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

  const renderActions = (row: Donation) => {
    const busy = actingId === row.donationId;
    if (row.status === 'pending') {
      return (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="success"
            icon={<Check className="h-3.5 w-3.5" />}
            loading={busy}
            onClick={() => handleAction(row, 'approved')}
          >
            {t('donations.approve')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<X className="h-3.5 w-3.5" />}
            disabled={busy}
            onClick={() => handleAction(row, 'cancelled')}
          >
            {t('donations.cancel')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => setSelected(row)}
          >
            {t('donations.view')}
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
            onClick={() => handleAction(row, 'completed')}
          >
            {t('donations.complete')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<X className="h-3.5 w-3.5" />}
            disabled={busy}
            onClick={() => handleAction(row, 'cancelled')}
          >
            {t('donations.cancel')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => setSelected(row)}
          >
            {t('donations.view')}
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
          {t('donations.view')}
        </Button>
      </div>
    );
  };

  const tabLabel = (key: Tab): string => {
    if (key === 'all') return t('donations.all');
    return statusLabel(key);
  };

  return (
    <div>
      <PageHeader
        title={t('donations.title')}
        subtitle={t('donations.subtitle')}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={refetch}
            loading={loading && rows.length > 0}
          >
            {t('donations.retry')}
          </Button>
        }
      />

      <Card className="border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40">
        <p className="text-xs font-medium text-sky-800 dark:text-sky-200">
          {t('donations.scope', { district: districtDisplay })}
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
              htmlFor="donation-search"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('common.search')}
            </label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="donation-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t('donations.searchPlaceholder')}
                className="pl-9"
                aria-label={t('donations.searchPlaceholder')}
              />
            </div>
          </div>

          <div className="min-w-[130px] flex-1 sm:flex-none">
            <label
              htmlFor="donation-group"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('donations.group')}
            </label>
            <Select
              id="donation-group"
              className="mt-1.5"
              value={bloodGroup}
              onChange={(e) => {
                setBloodGroup(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('donations.allGroups')}</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card padded={false} className="mt-4 overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center p-10">
            <Spinner size="lg" />
          </div>
        ) : error && rows.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={refetch}>
              {t('donations.retry')}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={t('donations.empty')} hint={t('donations.noResultsHint')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>{t('donations.donationId')}</th>
                    <th className={th}>{t('donations.donor')}</th>
                    <th className={th}>{t('donations.group')}</th>
                    <th className={th}>{t('donations.mobile')}</th>
                    <th className={th}>{t('donations.date')}</th>
                    <th className={th}>{t('donations.status')}</th>
                    <th className={`${th} text-right`}>{t('donations.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {rows.map((row) => (
                    <tr key={row.donationId} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {row.donationId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                        {row.donorName}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="red">{row.bloodGroup}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {row.mobile}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {row.availableDate ? formatDate(row.availableDate, locale) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(row.status)} dot>
                          {statusLabel(row.status)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{renderActions(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {rows.map((row) => (
                <div key={row.donationId} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {row.donorName}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {row.donationId} · {row.bloodGroup}
                      </p>
                    </div>
                    <Badge tone={statusTone(row.status)} dot>
                      {statusLabel(row.status)}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {row.mobile} · {row.availableDate ? formatDate(row.availableDate, locale) : '—'}
                  </p>
                  <div className="mt-3">{renderActions(row)}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('donations.showing', { count: rows.length, total })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ←
                </Button>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  →
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.donationId ?? ''}
        subtitle={t('donations.subtitle')}
        footer={
          <Button variant="outline" onClick={() => setSelected(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {selected ? (
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            {detailRow(t('donations.donor'), selected.donorName)}
            {detailRow(t('donors.district'), selected.districtId || districtDisplay)}
            {detailRow(t('donations.group'), selected.bloodGroup)}
            {detailRow(t('donations.mobile'), selected.mobile)}
            {detailRow(
              t('donations.date'),
              selected.availableDate ? formatDate(selected.availableDate, locale) : '—',
            )}
            {detailRow(t('donations.status'), statusLabel(selected.status))}
            {selected.notes ? detailRow('Notes', selected.notes) : null}
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
