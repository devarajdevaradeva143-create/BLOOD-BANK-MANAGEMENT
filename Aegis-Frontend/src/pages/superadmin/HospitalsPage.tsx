import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { DISTRICTS } from '../../data/constants';
import { listHospitals } from '../../lib/api';
import type { DistrictHospital } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected';

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
const td = 'px-4 py-3 text-sm text-slate-700 dark:text-slate-300';

const PAGE_LIMIT = 10;

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}

export default function HospitalsPage() {
  const { t } = useI18n();
  const [hospitals, setHospitals] = useState<DistrictHospital[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [district, setDistrict] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [viewId, setViewId] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, district, status]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await listHospitals({
          search: debouncedSearch || undefined,
          districtId: district !== 'all' ? district.trim().toLowerCase() : undefined,
          page,
          limit: PAGE_LIMIT,
        });
        if (cancelled) return;
        setHospitals(res.data ?? []);
        setTotal(res.total ?? 0);
        setTotalPages(Math.max(1, res.totalPages ?? 1));
      } catch (e) {
        if (cancelled) return;
        setHospitals([]);
        setTotal(0);
        setTotalPages(1);
        setError(e instanceof Error ? e.message : t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, district, page, refreshNonce, t]);

  const filtered = useMemo(() => {
    if (status === 'all') return hospitals;
    return hospitals.filter((h) => h.status.trim().toLowerCase() === status);
  }, [hospitals, status]);

  const viewing = hospitals.find((h) => h.id === viewId) ?? null;

  function statusTone(s: string): 'amber' | 'emerald' | 'rose' {
    const v = s.trim().toLowerCase();
    if (v === 'pending') return 'amber';
    if (v === 'approved') return 'emerald';
    return 'rose';
  }

  function statusLabel(s: string): string {
    const v = s.trim().toLowerCase();
    if (v === 'pending') return t('admin.approvals.pending');
    if (v === 'approved') return t('admin.approvals.approved');
    return t('admin.approvals.rejected');
  }

  const handleToggle = (hospital: DistrictHospital) => {
    // No backend PATCH /api/hospitals/:id/status (verified in
    // backend/src/routes/hospitals.routes.js) — local-only flip + toast.
    const next = hospital.status.trim().toLowerCase() === 'approved' ? 'rejected' : 'approved';
    setHospitals((prev) => prev.map((h) => (h.id === hospital.id ? { ...h, status: next } : h)));
    toast.success(t('common.success'));
  };

  const refetch = () => setRefreshNonce((n) => n + 1);

  const renderRowActions = (hospital: DistrictHospital) => (
    <div className="flex items-center justify-end gap-1.5">
      <Button variant="outline" size="sm" onClick={() => setViewId(hospital.id)}>
        {t('admin.table.view')}
      </Button>
      <Button
        variant={hospital.status.trim().toLowerCase() === 'approved' ? 'outline' : 'success'}
        size="sm"
        onClick={() => handleToggle(hospital)}
      >
        {hospital.status.trim().toLowerCase() === 'approved'
          ? t('admin.hospitals.deactivate')
          : t('admin.hospitals.activate')}
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader title={t('admin.hospitals.title')} subtitle={t('admin.hospitals.subtitle')} />

      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
        <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
          Hospital editing is disabled — backend PATCH /api/hospitals/:id/status is not available
          (see backend/src/routes/hospitals.routes.js). Status toggles update local state only.
        </p>
      </Card>

      <Card padded={false} className="mt-4 overflow-hidden">
        <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.table.searchPh')}
            aria-label={t('admin.table.searchPh')}
          />
          <Select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            aria-label={t('admin.approvals.district')}
          >
            <option value="all">{t('admin.table.allDistricts')}</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            aria-label={t('admin.approvals.status')}
          >
            <option value="all">{t('admin.table.allStatus')}</option>
            <option value="approved">{t('admin.approvals.approved')}</option>
            <option value="pending">{t('admin.approvals.pending')}</option>
            <option value="rejected">{t('admin.approvals.rejected')}</option>
          </Select>
        </div>

        {loading && hospitals.length === 0 ? (
          <div className="flex items-center justify-center gap-3 border-t border-slate-200 py-12 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-200 px-6 py-12 text-center dark:border-slate-800">
            <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-t border-slate-200 dark:border-slate-800">
            <EmptyState title={t('admin.table.noResults')} hint={t('admin.table.noResultsHint')} />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>{t('admin.approvals.hospital')}</th>
                    <th className={th}>{t('admin.approvals.district')}</th>
                    <th className={th}>{t('admin.approvals.license')}</th>
                    <th className={th}>{t('admin.banks.contact')}</th>
                    <th className={th}>{t('admin.approvals.status')}</th>
                    <th className={`${th} text-right`}>{t('admin.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {filtered.map((hospital) => (
                    <tr
                      key={hospital.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                        {hospital.name || '—'}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{hospital.district || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {hospital.license || '—'}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{hospital.contact || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={statusTone(hospital.status)}>
                          {statusLabel(hospital.status)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{renderRowActions(hospital)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {filtered.map((hospital) => (
                <div key={hospital.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {hospital.name || '—'}
                    </p>
                    <Badge tone={statusTone(hospital.status)}>
                      {statusLabel(hospital.status)}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {hospital.district || '—'} · {hospital.license || '—'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {t('admin.banks.contact')}: {hospital.contact || '—'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setViewId(hospital.id)}>
                      {t('admin.table.view')}
                    </Button>
                    <Button
                      variant={
                        hospital.status.trim().toLowerCase() === 'approved' ? 'outline' : 'success'
                      }
                      size="sm"
                      onClick={() => handleToggle(hospital)}
                    >
                      {hospital.status.trim().toLowerCase() === 'approved'
                        ? t('admin.hospitals.deactivate')
                        : t('admin.hospitals.activate')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('admin.table.showing', { count: filtered.length, total })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={viewing !== null}
        onClose={() => setViewId(null)}
        title={t('admin.hospitals.viewProfile')}
        subtitle={viewing?.name}
        footer={
          <Button variant="outline" onClick={() => setViewId(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {viewing ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label="ID" value={viewing.id || '—'} />
            <Detail label={t('admin.approvals.hospital')} value={viewing.name || '—'} />
            <Detail label={t('admin.approvals.district')} value={viewing.district || '—'} />
            <Detail label={t('admin.approvals.license')} value={viewing.license || '—'} />
            <Detail
              label={t('admin.approvals.status')}
              value={
                <Badge tone={statusTone(viewing.status)}>{statusLabel(viewing.status)}</Badge>
              }
            />
            <Detail label={t('admin.banks.contact')} value={viewing.contact || '—'} />
            <Detail label={t('admin.admins.email')} value={viewing.email || '—'} />
            <Detail label="Address" value={viewing.address || '—'} />
            <Detail label="Admin Name" value={viewing.officer ?? viewing.adminName ?? '—'} />
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
