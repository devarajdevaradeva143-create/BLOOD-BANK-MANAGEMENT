import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { DISTRICTS } from '../data/constants';
import { listHospitals } from '../lib/api';
import type { DistrictHospital } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';

type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected';

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
const td = 'px-4 py-3 text-sm text-slate-700 dark:text-slate-300';

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
  const { user } = useAuth();

  const [hospitals, setHospitals] = useState<DistrictHospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [viewId, setViewId] = useState<string | null>(null);
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
      // Fail-closed: never show other districts when scope is unknown.
      if (districtMissing) {
        setHospitals([]);
        setError(t('donations.forbidden'));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // District is ALWAYS sent — slug + display both.
        const res = await listHospitals({
          districtId: userDistrictSlug || undefined,
          district: userDistrictDisplay || undefined,
          page: 1,
          limit: 100,
        });
        if (cancelled) return;
        // Client-side assert: drop rows from other districts.
        const scoped = (res.data ?? []).filter((h) => {
          if (!userDistrictSlug) return true;
          const v = (h.district ?? '').trim().toLowerCase();
          return !v || v === userDistrictSlug;
        });
        setHospitals(scoped);
      } catch (e) {
        if (cancelled) return;
        // Graceful fallback: empty array + EmptyState, never crash.
        setHospitals([]);
        setError(e instanceof Error ? e.message : t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [userDistrictDisplay, userDistrictSlug, districtMissing, refreshNonce, t]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return hospitals.filter((h) => {
      if (q && !`${h.name} ${h.contact}`.toLowerCase().includes(q)) return false;
      if (status !== 'all' && h.status.trim().toLowerCase() !== status) return false;
      return true;
    });
  }, [hospitals, debouncedSearch, status]);

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

  const refetch = () => setRefreshNonce((n) => n + 1);

  return (
    <div>
      <PageHeader title={t('admin.hospitals.title')} subtitle={t('admin.hospitals.subtitle')} />

      <Card className="border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40">
        <p className="text-xs font-medium text-sky-800 dark:text-sky-200">
          Showing hospitals for {scopeDisplay}
        </p>
      </Card>

      <Card padded={false} className="mt-4 overflow-hidden">
        <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.table.searchPh')}
            aria-label={t('admin.table.searchPh')}
          />
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
                        {hospital.name}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{hospital.district || '—'}</td>
                      <td className={`${td} whitespace-nowrap`}>{hospital.contact || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={statusTone(hospital.status)}>
                          {statusLabel(hospital.status)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setViewId(hospital.id)}>
                          {t('admin.table.view')}
                        </Button>
                      </td>
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
                      {hospital.name}
                    </p>
                    <Badge tone={statusTone(hospital.status)}>
                      {statusLabel(hospital.status)}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {hospital.district || '—'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {t('admin.banks.contact')}: {hospital.contact || '—'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setViewId(hospital.id)}>
                      {t('admin.table.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="border-t border-slate-200 px-4 py-3 text-xs font-medium text-slate-500 sm:px-5 dark:border-slate-800 dark:text-slate-400">
          {t('admin.table.showing', { count: filtered.length, total: hospitals.length })}
        </p>
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
            <Detail label={t('admin.approvals.hospital')} value={viewing.name || '—'} />
            <Detail label={t('admin.approvals.district')} value={viewing.district || '—'} />
            <Detail
              label={t('admin.approvals.status')}
              value={
                <Badge tone={statusTone(viewing.status)}>{statusLabel(viewing.status)}</Badge>
              }
            />
            {viewing.license ? (
              <Detail label={t('admin.approvals.license')} value={viewing.license} />
            ) : null}
            <Detail label={t('admin.banks.contact')} value={viewing.contact || '—'} />
            <Detail label={t('admin.admins.email')} value={viewing.email || '—'} />
            <Detail label="Address" value={viewing.address || '—'} />
            <Detail label="Nodal Officer" value={viewing.officer ?? viewing.adminName ?? '—'} />
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
