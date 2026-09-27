import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Eye, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { BLOOD_GROUPS, DISTRICTS } from '../data/constants';
import { listDonors } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

interface DistrictDonor {
  donorId: string;
  fullName: string;
  bloodGroup: string;
  mobile: string;
  district: string;
  status: string;
}

function mapDonor(raw: unknown): DistrictDonor {
  const r = (raw ?? {}) as Record<string, unknown>;
  const donorId =
    (typeof r.donorId === 'string' && r.donorId) ||
    (typeof r.id === 'string' && r.id) ||
    (typeof r._id === 'string' && r._id) ||
    '';
  return {
    donorId,
    fullName: typeof r.fullName === 'string' ? r.fullName : typeof r.name === 'string' ? r.name : '',
    bloodGroup: typeof r.bloodGroup === 'string' ? r.bloodGroup : '',
    mobile: typeof r.mobile === 'string' ? r.mobile : '',
    district: typeof r.district === 'string' ? r.district : '',
    status: typeof r.status === 'string' ? r.status : 'Registered',
  };
}

export default function DonorsPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<DistrictDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DistrictDonor | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const userDistrictSlug = useMemo(() => (user?.districtId ?? '').trim().toLowerCase(), [user]);

  const userDistrictDisplay = useMemo(() => {
    if (!userDistrictSlug) return '';
    const found = DISTRICTS.find((d) => d.toLowerCase() === userDistrictSlug);
    return found ?? user?.districtId ?? '';
  }, [user, userDistrictSlug]);

  const scopeDisplay = userDistrictDisplay || user?.districtId || '—';
  const districtMissing = user?.role === 'DistrictAdmin' && !userDistrictSlug;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      // Fail-closed: district illana ella district-um kaata koodadhu.
      if (districtMissing) {
        setRows([]);
        setTotal(0);
        setError(t('donations.forbidden'));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // District is ALWAYS sent — slug + display rendum.
        const res = await listDonors({
          bloodGroup: bloodGroup || undefined,
          districtId: userDistrictSlug || undefined,
          district: userDistrictDisplay || undefined,
          search: debouncedSearch || undefined,
          page,
          limit,
        });
        if (cancelled) return;
        // Client-side assert: vera district row vandha drop pannu.
        const mapped = (res.data ?? []).map(mapDonor).filter((d) => {
          if (!userDistrictSlug) return true;
          const v = (d.district ?? '').trim().toLowerCase();
          return !v || v === userDistrictSlug;
        });
        setRows(mapped);
        setTotal(res.total ?? 0);
      } catch (e) {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : t('donors.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [bloodGroup, userDistrictDisplay, userDistrictSlug, districtMissing, debouncedSearch, page, refreshNonce, t]);

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

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const statusBadge = (status: string) => {
    const lowered = status.toLowerCase();
    if (lowered === 'deferred')
      return (
        <Badge tone="amber">{t('donors.deferred')}</Badge>
      );
    if (lowered === 'donated')
      return (
        <Badge tone="sky">{t('donors.donated')}</Badge>
      );
    return <Badge tone="emerald">{t('donors.registered')}</Badge>;
  };

  const detailRow = (label: string, value: ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
    </div>
  );

  const renderViewAction = (donor: DistrictDonor) => (
    <Button
      variant="outline"
      size="sm"
      icon={<Eye className="h-3.5 w-3.5" />}
      onClick={() => setSelected(donor)}
    >
      {t('donors.view')}
    </Button>
  );

  const refetch = () => setRefreshNonce((n) => n + 1);

  return (
    <div>
      <PageHeader title={t('donors.title')} subtitle={t('donors.subtitle')} />

      <Card className="border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40">
        <p className="text-xs font-medium text-sky-800 dark:text-sky-200">
          {t('donors.scope', { district: scopeDisplay })}
        </p>
      </Card>

      <Card className="mt-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full min-w-[180px] flex-1 sm:w-auto">
            <label
              htmlFor="donor-search"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('common.search')}
            </label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="donor-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t('donors.searchPlaceholder')}
                className="pl-9"
                aria-label={t('donors.searchPlaceholder')}
              />
            </div>
          </div>

          <div className="min-w-[130px] flex-1 sm:flex-none">
            <label
              htmlFor="donor-group"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('donors.group')}
            </label>
            <Select
              id="donor-group"
              className="mt-1.5"
              value={bloodGroup}
              onChange={(e) => {
                setBloodGroup(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('donors.allGroups')}</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('donors.showing', { count: rows.length, total })}
      </p>

      <Card padded={false} className="mt-3 overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('donors.loading')}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              {t('donors.retry')}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={t('donors.empty')} hint={t('donors.noResultsHint')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>{t('donors.donorId')}</th>
                    <th className={th}>{t('donors.name')}</th>
                    <th className={th}>{t('donors.group')}</th>
                    <th className={th}>{t('donors.mobile')}</th>
                    <th className={th}>{t('donors.district')}</th>
                    <th className={th}>{t('donors.status')}</th>
                    <th className={`${th} text-right`}>{t('requests.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {rows.map((donor) => (
                    <tr
                      key={donor.donorId}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-semibold text-slate-900 dark:text-white">
                        {donor.donorId || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                        {donor.fullName || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone="red">{donor.bloodGroup || '—'}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {donor.mobile || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {donor.district || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {statusBadge(donor.status)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {renderViewAction(donor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {rows.map((donor) => (
                <div key={donor.donorId} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {donor.donorId || '—'}
                    </span>
                    {statusBadge(donor.status)}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-white">
                    {donor.fullName || '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="red">{donor.bloodGroup || '—'}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    {donor.district || '—'} · {t('donors.mobile')}: {donor.mobile || '—'}
                  </p>
                  <div className="mt-3">{renderViewAction(donor)}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('donors.showing', { count: rows.length, total })}
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
        title={selected?.fullName ?? ''}
        subtitle={selected?.donorId ?? ''}
        footer={
          <Button variant="outline" onClick={() => setSelected(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {selected ? (
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            {detailRow(t('donors.donorId'), <span className="font-mono">{selected.donorId || '—'}</span>)}
            {detailRow(t('donors.name'), selected.fullName || '—')}
            {detailRow(t('donors.group'), <Badge tone="red">{selected.bloodGroup || '—'}</Badge>)}
            {detailRow(t('donors.mobile'), selected.mobile || '—')}
            {detailRow(t('donors.district'), selected.district || '—')}
            {detailRow(t('donors.status'), statusBadge(selected.status))}
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
