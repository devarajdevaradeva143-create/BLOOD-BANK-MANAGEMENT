import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Eye, Search } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { listDonors } from '../../lib/api';
import { BLOOD_GROUPS, DISTRICTS } from '../../data/constants';
import type { BloodGroup } from '../../data/types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

type StatusFilter = '' | 'eligible' | 'deferred';

interface SuperAdminDonor {
  id: string;
  name: string;
  group: string;
  district: string;
  mobile: string;
  lastDonation: string;
  nextDonation: string;
  status: 'eligible' | 'deferred';
}

function mapDonor(raw: unknown): SuperAdminDonor {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string =>
    typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v);
  const first = (...vals: unknown[]): string => {
    for (const v of vals) {
      const s = str(v);
      if (s) return s;
    }
    return '';
  };
  const statusRaw = str(r.status).toLowerCase();
  return {
    id: first(r.donorId, r.id, r._id),
    name: first(r.fullName, r.name, r.donorName),
    group: first(r.bloodGroup, r.group),
    district: first(r.district, r.districtId),
    mobile: str(r.mobile),
    lastDonation: first(r.lastDonation, r.lastDonatedAt, r.lastDonated),
    nextDonation: first(r.nextDonation, r.nextEligible, r.nextEligibleDate),
    status: statusRaw.includes('defer') ? 'deferred' : 'eligible',
  };
}

const PAGE_SIZE = 12;

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

export default function DonorsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [group, setGroup] = useState<'' | BloodGroup>('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SuperAdminDonor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SuperAdminDonor | null>(null);
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
        const res = await listDonors({
          bloodGroup: group || undefined,
          district: district || undefined,
          search: debouncedSearch || undefined,
          page,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        const mapped = (res.data ?? []).map(mapDonor);
        setRows(status ? mapped.filter((d) => d.status === status) : mapped);
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
  }, [group, district, debouncedSearch, page, status, refreshNonce, t]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const refetch = () => setRefreshNonce((n) => n + 1);

  const statusBadge = (s: SuperAdminDonor['status']) => (
    <Badge tone={s === 'eligible' ? 'emerald' : 'amber'}>
      {s === 'eligible' ? t('admin.donors.eligible') : t('admin.donors.deferred')}
    </Badge>
  );

  const detailRow = (label: string, value: ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
    </div>
  );

  const renderViewAction = (donor: SuperAdminDonor) => (
    <Button variant="outline" size="sm" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setSelected(donor)}>
      {t('admin.table.view')}
    </Button>
  );

  return (
    <div>
      <PageHeader title={t('admin.donors.title')} subtitle={t('admin.donors.subtitle')} />

      <Card>
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
                placeholder={t('admin.table.searchPh')}
                className="pl-9"
                aria-label={t('admin.table.searchPh')}
              />
            </div>
          </div>

          <div className="min-w-[150px] flex-1 sm:flex-none">
            <label
              htmlFor="donor-district"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('admin.donors.district')}
            </label>
            <Select
              id="donor-district"
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

          <div className="min-w-[130px] flex-1 sm:flex-none">
            <label
              htmlFor="donor-group"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('admin.donors.group')}
            </label>
            <Select
              id="donor-group"
              className="mt-1.5"
              value={group}
              onChange={(e) => {
                setGroup(e.target.value as '' | BloodGroup);
                setPage(1);
              }}
            >
              <option value="">All</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-w-[150px] flex-1 sm:flex-none">
            <label
              htmlFor="donor-status"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {t('admin.donors.status')}
            </label>
            <Select
              id="donor-status"
              className="mt-1.5"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <option value="">{t('admin.table.allStatus')}</option>
              <option value="eligible">{t('admin.donors.eligible')}</option>
              <option value="deferred">{t('admin.donors.deferred')}</option>
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
                    <th className={th}>{t('admin.donors.donorId')}</th>
                    <th className={th}>{t('admin.donors.name')}</th>
                    <th className={th}>{t('admin.donors.group')}</th>
                    <th className={th}>{t('admin.donors.district')}</th>
                    <th className={th}>{t('admin.donors.lastDonation')}</th>
                    <th className={th}>{t('admin.donors.nextDonation')}</th>
                    <th className={th}>{t('admin.donors.status')}</th>
                    <th className={`${th} text-right`}>{t('admin.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {rows.map((donor) => (
                    <tr
                      key={donor.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-semibold text-slate-900 dark:text-white">
                        {donor.id || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                        {donor.name || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone="red">{donor.group || '—'}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {donor.district || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {donor.lastDonation || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {donor.nextDonation || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{statusBadge(donor.status)}</td>
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
                <div key={donor.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {donor.id || '—'}
                    </span>
                    {statusBadge(donor.status)}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-white">
                    {donor.name || '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="red">{donor.group || '—'}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    {donor.district || '—'} · {t('admin.donors.lastDonation')}:{' '}
                    {donor.lastDonation || '—'} · {t('admin.donors.nextDonation')}:{' '}
                    {donor.nextDonation || '—'}
                  </p>
                  <div className="mt-3">{renderViewAction(donor)}</div>
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
        title={selected?.name ?? ''}
        subtitle={selected?.id ?? ''}
        footer={
          <Button variant="outline" onClick={() => setSelected(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {selected ? (
          <dl className="divide-y divide-slate-100 dark:divide-slate-800">
            {detailRow(t('admin.donors.donorId'), <span className="font-mono">{selected.id || '—'}</span>)}
            {detailRow(t('admin.donors.name'), selected.name || '—')}
            {detailRow(t('admin.donors.group'), <Badge tone="red">{selected.group || '—'}</Badge>)}
            {detailRow(t('admin.donors.district'), selected.district || '—')}
            {detailRow(t('admin.donors.lastDonation'), selected.lastDonation || '—')}
            {detailRow(t('admin.donors.nextDonation'), selected.nextDonation || '—')}
            {detailRow(t('admin.donors.status'), statusBadge(selected.status))}
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
