import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { DISTRICTS } from '../../data/constants';
import { HOSPITALS } from '../../data/superadminMock';
import type { MockHospital } from '../../data/superadminMock';
import { useI18n } from '../../i18n/I18nContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';

type StatusFilter = 'all' | MockHospital['status'];

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
  const [hospitals, setHospitals] = useState<MockHospital[]>(HOSPITALS);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmNode, ask] = useConfirm();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hospitals.filter((h) => {
      if (q && !`${h.name} ${h.license}`.toLowerCase().includes(q)) return false;
      if (district !== 'all' && h.district !== district) return false;
      if (status !== 'all' && h.status !== status) return false;
      return true;
    });
  }, [hospitals, search, district, status]);

  const viewing = hospitals.find((h) => h.id === viewId) ?? null;

  function statusTone(s: MockHospital['status']): 'amber' | 'emerald' | 'rose' {
    if (s === 'pending') return 'amber';
    if (s === 'approved') return 'emerald';
    return 'rose';
  }

  function statusLabel(s: MockHospital['status']): string {
    if (s === 'pending') return t('admin.approvals.pending');
    if (s === 'approved') return t('admin.approvals.approved');
    return t('admin.approvals.rejected');
  }

  const handleApprove = (hospital: MockHospital) => {
    setHospitals((prev) =>
      prev.map((h) => (h.id === hospital.id ? { ...h, status: 'approved' } : h)),
    );
    toast.success(t('common.success'));
  };

  const handleReject = (hospital: MockHospital) => {
    setHospitals((prev) =>
      prev.map((h) => (h.id === hospital.id ? { ...h, status: 'rejected' } : h)),
    );
    toast.success(t('common.success'));
  };

  const askApprove = (hospital: MockHospital) =>
    ask({
      title: t('admin.approvals.confirmApprove'),
      message: t('admin.approvals.confirmApproveMsg', { name: hospital.name }),
      confirmLabel: t('admin.approvals.approve'),
      onConfirm: () => handleApprove(hospital),
    });

  const askReject = (hospital: MockHospital) =>
    ask({
      title: t('admin.approvals.confirmReject'),
      message: t('admin.approvals.confirmRejectMsg', { name: hospital.name }),
      confirmLabel: t('admin.approvals.reject'),
      destructive: true,
      onConfirm: () => handleReject(hospital),
    });

  const renderRowActions = (hospital: MockHospital) => (
    <div className="flex items-center justify-end gap-1.5">
      {hospital.status === 'pending' ? (
        <>
          <Button variant="success" size="sm" onClick={() => askApprove(hospital)}>
            {t('admin.approvals.approve')}
          </Button>
          <Button variant="danger" size="sm" onClick={() => askReject(hospital)}>
            {t('admin.approvals.reject')}
          </Button>
        </>
      ) : null}
      <Button variant="outline" size="sm" onClick={() => setViewId(hospital.id)}>
        {t('admin.table.view')}
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader title={t('admin.approvals.title')} subtitle={t('admin.approvals.subtitle')} />

      <Card padded={false} className="overflow-hidden">
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
            <option value="pending">{t('admin.approvals.pending')}</option>
            <option value="approved">{t('admin.approvals.approved')}</option>
            <option value="rejected">{t('admin.approvals.rejected')}</option>
          </Select>
        </div>

        {filtered.length === 0 ? (
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
                    <th className={th}>{t('admin.approvals.regDate')}</th>
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
                      <td className={`${td} whitespace-nowrap`}>{hospital.district}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {hospital.license}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{hospital.regDate}</td>
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
                      {hospital.name}
                    </p>
                    <Badge tone={statusTone(hospital.status)}>
                      {statusLabel(hospital.status)}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {hospital.district} · {hospital.license}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {t('admin.approvals.regDate')}: {hospital.regDate}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {hospital.status === 'pending' ? (
                      <>
                        <Button variant="success" size="sm" onClick={() => askApprove(hospital)}>
                          {t('admin.approvals.approve')}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => askReject(hospital)}>
                          {t('admin.approvals.reject')}
                        </Button>
                      </>
                    ) : null}
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
        title={viewing?.name ?? ''}
        subtitle={viewing?.id}
        footer={
          <Button variant="outline" onClick={() => setViewId(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {viewing ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label="ID" value={viewing.id} />
            <Detail label={t('admin.approvals.hospital')} value={viewing.name} />
            <Detail label={t('admin.approvals.district')} value={viewing.district} />
            <Detail label={t('admin.approvals.license')} value={viewing.license} />
            <Detail label={t('admin.approvals.regDate')} value={viewing.regDate} />
            <Detail
              label={t('admin.approvals.status')}
              value={
                <Badge tone={statusTone(viewing.status)}>{statusLabel(viewing.status)}</Badge>
              }
            />
            <Detail label={t('admin.banks.contact')} value={viewing.contact} />
            <Detail label={t('admin.admins.email')} value={viewing.email} />
            <Detail label="Address" value={viewing.address} />
            <Detail label="Admin Name" value={viewing.adminName} />
          </dl>
        ) : null}
      </Modal>

      {confirmNode}
    </div>
  );
}
