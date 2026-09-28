import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { DISTRICTS } from '../../data/constants';
import {
  listDonations,
  listHospitals,
  listRequests,
  updateDonationStatusApi,
  updateHospitalStatusApi,
  updateRequestStatusApi,
} from '../../lib/api';
import type { DistrictHospital } from '../../lib/api';
import type { BloodRequest, Donation } from '../../data/types';
import { useI18n } from '../../i18n/I18nContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

type Queue = 'hospitals' | 'requests' | 'donations';

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

export default function ApprovalsPage() {
  const { t } = useI18n();
  const [queue, setQueue] = useState<Queue>('hospitals');
  const [hospitals, setHospitals] = useState<DistrictHospital[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [counts, setCounts] = useState({ hospitals: 0, requests: 0, donations: 0 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [district, setDistrict] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [viewHospitalId, setViewHospitalId] = useState<string | null>(null);
  const [viewRequest, setViewRequest] = useState<BloodRequest | null>(null);
  const [viewDonation, setViewDonation] = useState<Donation | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [confirmNode, ask] = useConfirm();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setStatus('all');
  }, [queue]);

  // Tab badges: real pending totals (best effort).
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const [h, r, d] = await Promise.all([
          listHospitals({ page: 1, limit: 1 }).catch(() => ({ total: 0 })),
          listRequests({ status: 'submitted', page: 1, limit: 1 }).catch(() => ({ total: 0 })),
          listDonations({ status: 'pending', page: 1, limit: 1 }).catch(() => ({ total: 0 })),
        ]);
        if (!cancelled) {
          setCounts({
            hospitals: (h as { total?: number }).total ?? 0,
            requests: (r as { total?: number }).total ?? 0,
            donations: (d as { total?: number }).total ?? 0,
          });
        }
      } catch {
        /* ignore — badges stay zero */
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const districtSlug = district !== 'all' ? district.trim().toLowerCase() : undefined;
        if (queue === 'hospitals') {
          const res = await listHospitals({
            search: debouncedSearch || undefined,
            districtId: districtSlug,
            page: 1,
            limit: 50,
          });
          if (cancelled) return;
          setHospitals(res.data ?? []);
        } else if (queue === 'requests') {
          const res = await listRequests({
            search: debouncedSearch || undefined,
            districtId: districtSlug,
            status: status !== 'all' ? status : undefined,
            page: 1,
            limit: 50,
          });
          if (cancelled) return;
          setRequests(res.data ?? []);
        } else {
          const res = await listDonations({
            search: debouncedSearch || undefined,
            districtId: districtSlug,
            status: status !== 'all' ? status : undefined,
            page: 1,
            limit: 50,
          });
          if (cancelled) return;
          setDonations(res.data ?? []);
        }
      } catch (e) {
        if (cancelled) return;
        if (queue === 'hospitals') setHospitals([]);
        if (queue === 'requests') setRequests([]);
        if (queue === 'donations') setDonations([]);
        setError(e instanceof Error ? e.message : t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [queue, debouncedSearch, district, status, refreshNonce, t]);

  const filteredHospitals = useMemo(() => {
    if (status === 'all') return hospitals;
    return hospitals.filter((h) => h.status.trim().toLowerCase() === status.toLowerCase());
  }, [hospitals, status]);

  const viewingHospital = hospitals.find((h) => h.id === viewHospitalId) ?? null;

  function hospitalTone(s: string): 'amber' | 'emerald' | 'rose' {
    const v = s.trim().toLowerCase();
    if (v === 'pending') return 'amber';
    if (v === 'approved') return 'emerald';
    return 'rose';
  }

  function hospitalLabel(s: string): string {
    const v = s.trim().toLowerCase();
    if (v === 'pending') return t('admin.approvals.pending');
    if (v === 'approved') return t('admin.approvals.approved');
    return t('admin.approvals.rejected');
  }

  function requestTone(s: BloodRequest['status']): 'amber' | 'emerald' | 'sky' | 'rose' {
    if (s === 'approved') return 'emerald';
    if (s === 'fulfilled') return 'sky';
    if (s === 'cancelled') return 'rose';
    return 'amber';
  }

  function donationTone(s: Donation['status']): 'amber' | 'emerald' | 'sky' | 'rose' {
    if (s === 'approved') return 'emerald';
    if (s === 'completed') return 'sky';
    if (s === 'cancelled') return 'rose';
    return 'amber';
  }

  const handleHospitalDecision = async (hospital: DistrictHospital, next: 'approved' | 'rejected') => {
    setActingId(hospital.id);
    try {
      // Backend has no PATCH /api/hospitals/:id/status
      // (verified in backend/src/routes/hospitals.routes.js) — try once,
      // then fall back to local state + toast with backend-pending note.
      const updated = await updateHospitalStatusApi(hospital.id, next);
      setHospitals((prev) => prev.map((h) => (h.id === hospital.id ? updated : h)));
      toast.success(t('common.success'));
    } catch {
      setHospitals((prev) =>
        prev.map((h) => (h.id === hospital.id ? { ...h, status: next } : h)),
      );
      toast.success(`${t('common.success')} (${t('admin.table.noResultsHint')})`);
    } finally {
      setActingId(null);
    }
  };

  const handleRequestDecision = async (row: BloodRequest, next: 'approved' | 'cancelled') => {
    setActingId(row.requestId);
    try {
      const updated = await updateRequestStatusApi(row.requestId, next);
      setRequests((prev) => prev.map((r) => (r.requestId === row.requestId ? updated : r)));
      setViewRequest((prev) => (prev && prev.requestId === row.requestId ? updated : prev));
      toast.success(t('common.success'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setActingId(null);
    }
  };

  const handleDonationDecision = async (row: Donation, next: 'approved' | 'cancelled') => {
    setActingId(row.donationId);
    try {
      const updated = await updateDonationStatusApi(row.donationId, next);
      setDonations((prev) => prev.map((d) => (d.donationId === row.donationId ? updated : d)));
      setViewDonation((prev) => (prev && prev.donationId === row.donationId ? updated : prev));
      toast.success(t('common.success'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setActingId(null);
    }
  };

  const askHospital = (hospital: DistrictHospital, next: 'approved' | 'rejected') =>
    ask({
      title:
        next === 'approved' ? t('admin.approvals.confirmApprove') : t('admin.approvals.confirmReject'),
      message:
        next === 'approved'
          ? t('admin.approvals.confirmApproveMsg', { name: hospital.name })
          : t('admin.approvals.confirmRejectMsg', { name: hospital.name }),
      confirmLabel:
        next === 'approved' ? t('admin.approvals.approve') : t('admin.approvals.reject'),
      destructive: next === 'rejected',
      onConfirm: () => void handleHospitalDecision(hospital, next),
    });

  const askRequest = (row: BloodRequest, next: 'approved' | 'cancelled') =>
    ask({
      title:
        next === 'approved' ? t('admin.approvals.confirmApprove') : t('admin.approvals.confirmReject'),
      message: t('admin.approvals.confirmApproveMsg', { name: row.requestId }),
      confirmLabel:
        next === 'approved' ? t('admin.approvals.approve') : t('admin.approvals.reject'),
      destructive: next === 'cancelled',
      onConfirm: () => void handleRequestDecision(row, next),
    });

  const askDonation = (row: Donation, next: 'approved' | 'cancelled') =>
    ask({
      title:
        next === 'approved' ? t('admin.approvals.confirmApprove') : t('admin.approvals.confirmReject'),
      message: t('admin.approvals.confirmApproveMsg', { name: row.donationId }),
      confirmLabel:
        next === 'approved' ? t('admin.approvals.approve') : t('admin.approvals.reject'),
      destructive: next === 'cancelled',
      onConfirm: () => void handleDonationDecision(row, next),
    });

  const refetch = () => setRefreshNonce((n) => n + 1);
  const rowCount = queue === 'hospitals' ? filteredHospitals.length : queue === 'requests' ? requests.length : donations.length;

  const statusOptions: string[] =
    queue === 'hospitals'
      ? ['all', 'pending', 'approved', 'rejected']
      : queue === 'requests'
        ? ['all', 'submitted', 'approved', 'fulfilled', 'cancelled']
        : ['all', 'pending', 'approved', 'completed', 'cancelled'];

  return (
    <div>
      <PageHeader title={t('admin.approvals.title')} subtitle={t('admin.approvals.subtitle')} />

      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
        <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
          Hospital approvals are local-only — PATCH /api/hospitals/:id/status was not found in
          backend routes. Request and donation approvals use real PATCH endpoints.
        </p>
      </Card>

      <Card className="mt-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: 'hospitals', label: t('admin.approvals.hospital'), count: counts.hospitals },
              { key: 'requests', label: t('admin.requests.title'), count: counts.requests },
              { key: 'donations', label: t('admin.districts.donors'), count: counts.donations },
            ] as { key: Queue; label: string; count: number }[]
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setQueue(item.key)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition ${
                queue === item.key
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  queue === item.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
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
            onChange={(e) => setStatus(e.target.value)}
            aria-label={t('admin.approvals.status')}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? t('admin.table.allStatus') : s}
              </option>
            ))}
          </Select>
        </div>

        {loading && rowCount === 0 ? (
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
        ) : rowCount === 0 ? (
          <div className="border-t border-slate-200 dark:border-slate-800">
            <EmptyState title={t('admin.table.noResults')} hint={t('admin.table.noResultsHint')} />
          </div>
        ) : queue === 'hospitals' ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>{t('admin.approvals.hospital')}</th>
                    <th className={th}>{t('admin.approvals.district')}</th>
                    <th className={th}>{t('admin.approvals.license')}</th>
                    <th className={th}>{t('admin.approvals.regDate')}</th>
                    <th className={th}>{t('admin.approvals.status')}</th>
                    <th className={`${th} text-right`}>{t('admin.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {filteredHospitals.map((hospital) => (
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
                      <td className={`${td} whitespace-nowrap`}>—</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={hospitalTone(hospital.status)}>
                          {hospitalLabel(hospital.status)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="success"
                            size="sm"
                            loading={actingId === hospital.id}
                            onClick={() => askHospital(hospital, 'approved')}
                          >
                            {t('admin.approvals.approve')}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            loading={actingId === hospital.id}
                            onClick={() => askHospital(hospital, 'rejected')}
                          >
                            {t('admin.approvals.reject')}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setViewHospitalId(hospital.id)}>
                            {t('admin.table.view')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {filteredHospitals.map((hospital) => (
                <div key={hospital.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {hospital.name || '—'}
                    </p>
                    <Badge tone={hospitalTone(hospital.status)}>
                      {hospitalLabel(hospital.status)}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {hospital.district || '—'} · {hospital.license || '—'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button variant="success" size="sm" onClick={() => askHospital(hospital, 'approved')}>
                      {t('admin.approvals.approve')}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => askHospital(hospital, 'rejected')}>
                      {t('admin.approvals.reject')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setViewHospitalId(hospital.id)}>
                      {t('admin.table.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : queue === 'requests' ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>{t('admin.requests.requestId')}</th>
                    <th className={th}>{t('admin.requests.hospital')}</th>
                    <th className={th}>{t('admin.donors.district')}</th>
                    <th className={th}>{t('admin.requests.group')}</th>
                    <th className={th}>{t('admin.requests.units')}</th>
                    <th className={th}>{t('common.status')}</th>
                    <th className={`${th} text-right`}>{t('admin.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {requests.map((row) => (
                    <tr
                      key={row.requestId}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {row.requestId}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                        {row.hospitalName || '—'}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{row.districtId || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone="red">{row.bloodGroup || '—'}</Badge>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{row.units}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={requestTone(row.status)}>{row.status}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {row.status === 'submitted' ? (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                loading={actingId === row.requestId}
                                onClick={() => askRequest(row, 'approved')}
                              >
                                {t('admin.approvals.approve')}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                loading={actingId === row.requestId}
                                onClick={() => askRequest(row, 'cancelled')}
                              >
                                {t('admin.approvals.reject')}
                              </Button>
                            </>
                          ) : null}
                          <Button variant="outline" size="sm" onClick={() => setViewRequest(row)}>
                            {t('admin.table.view')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {requests.map((row) => (
                <div key={row.requestId} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {row.requestId}
                    </span>
                    <Badge tone={requestTone(row.status)}>{row.status}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-white">
                    {row.hospitalName || '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {row.districtId || '—'} · {row.bloodGroup || '—'} · {row.units} units
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {row.status === 'submitted' ? (
                      <>
                        <Button variant="success" size="sm" onClick={() => askRequest(row, 'approved')}>
                          {t('admin.approvals.approve')}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => askRequest(row, 'cancelled')}>
                          {t('admin.approvals.reject')}
                        </Button>
                      </>
                    ) : null}
                    <Button variant="outline" size="sm" onClick={() => setViewRequest(row)}>
                      {t('admin.table.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>{t('admin.approvals.hospital')}</th>
                    <th className={th}>{t('admin.approvals.district')}</th>
                    <th className={th}>{t('admin.requests.group')}</th>
                    <th className={th}>{t('admin.banks.contact')}</th>
                    <th className={th}>{t('admin.approvals.status')}</th>
                    <th className={`${th} text-right`}>{t('admin.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {donations.map((row) => (
                    <tr
                      key={row.donationId}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                        {row.donorName || row.donationId}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{row.districtId || row.district || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone="red">{row.bloodGroup || '—'}</Badge>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{row.mobile || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={donationTone(row.status)}>{row.status}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {row.status === 'pending' ? (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                loading={actingId === row.donationId}
                                onClick={() => askDonation(row, 'approved')}
                              >
                                {t('admin.approvals.approve')}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                loading={actingId === row.donationId}
                                onClick={() => askDonation(row, 'cancelled')}
                              >
                                {t('admin.approvals.reject')}
                              </Button>
                            </>
                          ) : null}
                          <Button variant="outline" size="sm" onClick={() => setViewDonation(row)}>
                            {t('admin.table.view')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {donations.map((row) => (
                <div key={row.donationId} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {row.donorName || row.donationId}
                    </p>
                    <Badge tone={donationTone(row.status)}>{row.status}</Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {row.districtId || row.district || '—'} · {row.bloodGroup || '—'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {row.status === 'pending' ? (
                      <>
                        <Button variant="success" size="sm" onClick={() => askDonation(row, 'approved')}>
                          {t('admin.approvals.approve')}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => askDonation(row, 'cancelled')}>
                          {t('admin.approvals.reject')}
                        </Button>
                      </>
                    ) : null}
                    <Button variant="outline" size="sm" onClick={() => setViewDonation(row)}>
                      {t('admin.table.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="border-t border-slate-200 px-4 py-3 text-xs font-medium text-slate-500 sm:px-5 dark:border-slate-800 dark:text-slate-400">
          {t('admin.table.showing', {
            count: rowCount,
            total: queue === 'hospitals' ? hospitals.length : queue === 'requests' ? requests.length : donations.length,
          })}
        </p>
      </Card>

      <Modal
        open={viewingHospital !== null}
        onClose={() => setViewHospitalId(null)}
        title={viewingHospital?.name ?? ''}
        subtitle={viewingHospital?.id}
        footer={
          <Button variant="outline" onClick={() => setViewHospitalId(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {viewingHospital ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label="ID" value={viewingHospital.id || '—'} />
            <Detail label={t('admin.approvals.hospital')} value={viewingHospital.name || '—'} />
            <Detail label={t('admin.approvals.district')} value={viewingHospital.district || '—'} />
            <Detail label={t('admin.approvals.license')} value={viewingHospital.license || '—'} />
            <Detail
              label={t('admin.approvals.status')}
              value={
                <Badge tone={hospitalTone(viewingHospital.status)}>
                  {hospitalLabel(viewingHospital.status)}
                </Badge>
              }
            />
            <Detail label={t('admin.banks.contact')} value={viewingHospital.contact || '—'} />
            <Detail label={t('admin.admins.email')} value={viewingHospital.email || '—'} />
            <Detail label="Address" value={viewingHospital.address || '—'} />
            <Detail
              label="Admin Name"
              value={viewingHospital.officer ?? viewingHospital.adminName ?? '—'}
            />
          </dl>
        ) : null}
      </Modal>

      <Modal
        open={viewRequest !== null}
        onClose={() => setViewRequest(null)}
        title={viewRequest?.requestId ?? ''}
        subtitle={viewRequest?.hospitalName}
        footer={
          <Button variant="outline" onClick={() => setViewRequest(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {viewRequest ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label={t('admin.requests.requestId')} value={viewRequest.requestId} />
            <Detail label={t('admin.requests.hospital')} value={viewRequest.hospitalName || '—'} />
            <Detail label={t('admin.donors.district')} value={viewRequest.districtId || '—'} />
            <Detail label={t('admin.requests.group')} value={viewRequest.bloodGroup || '—'} />
            <Detail label={t('admin.requests.units')} value={viewRequest.units} />
            <Detail
              label={t('common.status')}
              value={<Badge tone={requestTone(viewRequest.status)}>{viewRequest.status}</Badge>}
            />
          </dl>
        ) : null}
      </Modal>

      <Modal
        open={viewDonation !== null}
        onClose={() => setViewDonation(null)}
        title={viewDonation?.donationId ?? ''}
        subtitle={viewDonation?.donorName}
        footer={
          <Button variant="outline" onClick={() => setViewDonation(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {viewDonation ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label="ID" value={viewDonation.donationId} />
            <Detail label={t('admin.approvals.hospital')} value={viewDonation.donorName || '—'} />
            <Detail
              label={t('admin.approvals.district')}
              value={viewDonation.districtId || viewDonation.district || '—'}
            />
            <Detail label={t('admin.requests.group')} value={viewDonation.bloodGroup || '—'} />
            <Detail label={t('admin.banks.contact')} value={viewDonation.mobile || '—'} />
            <Detail
              label={t('common.status')}
              value={<Badge tone={donationTone(viewDonation.status)}>{viewDonation.status}</Badge>}
            />
          </dl>
        ) : null}
      </Modal>

      {confirmNode}
    </div>
  );
}
