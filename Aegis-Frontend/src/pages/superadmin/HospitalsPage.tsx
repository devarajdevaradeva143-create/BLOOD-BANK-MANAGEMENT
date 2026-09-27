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
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
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

interface HospitalEditForm {
  contact: string;
  email: string;
  address: string;
  adminName: string;
}

type EditErrors = Partial<Record<keyof HospitalEditForm, string>>;

export default function HospitalsPage() {
  const { t } = useI18n();
  const [hospitals, setHospitals] = useState<MockHospital[]>(HOSPITALS);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<HospitalEditForm>({
    contact: '',
    email: '',
    address: '',
    adminName: '',
  });
  const [editErrors, setEditErrors] = useState<EditErrors>({});

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
  const editing = hospitals.find((h) => h.id === editId) ?? null;

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

  const handleToggle = (hospital: MockHospital) => {
    const next: MockHospital['status'] =
      hospital.status === 'approved' ? 'rejected' : 'approved';
    setHospitals((prev) => prev.map((h) => (h.id === hospital.id ? { ...h, status: next } : h)));
    toast.success(t('common.success'));
  };

  const openEdit = (hospital: MockHospital) => {
    setEditId(hospital.id);
    setEditForm({
      contact: hospital.contact,
      email: hospital.email,
      address: hospital.address,
      adminName: hospital.adminName,
    });
    setEditErrors({});
  };

  const setEditField = (key: keyof HospitalEditForm, value: string) =>
    setEditForm((prev) => ({ ...prev, [key]: value }));

  const handleSaveEdit = () => {
    if (!editing) return;
    const next: EditErrors = {};
    if (!editForm.contact.trim()) next.contact = t('validation.required');
    if (!editForm.email.trim()) next.email = t('validation.required');
    if (!editForm.address.trim()) next.address = t('validation.required');
    if (!editForm.adminName.trim()) next.adminName = t('validation.required');
    setEditErrors(next);
    if (Object.keys(next).length > 0) return;
    setHospitals((prev) =>
      prev.map((h) =>
        h.id === editing.id
          ? {
              ...h,
              contact: editForm.contact.trim(),
              email: editForm.email.trim(),
              address: editForm.address.trim(),
              adminName: editForm.adminName.trim(),
            }
          : h,
      ),
    );
    toast.success(t('common.success'));
    setEditId(null);
  };

  const renderRowActions = (hospital: MockHospital) => (
    <div className="flex items-center justify-end gap-1.5">
      <Button variant="outline" size="sm" onClick={() => setViewId(hospital.id)}>
        {t('admin.table.view')}
      </Button>
      <Button
        variant={hospital.status === 'approved' ? 'outline' : 'success'}
        size="sm"
        onClick={() => handleToggle(hospital)}
      >
        {hospital.status === 'approved'
          ? t('admin.hospitals.deactivate')
          : t('admin.hospitals.activate')}
      </Button>
      <Button variant="outline" size="sm" onClick={() => openEdit(hospital)}>
        {t('admin.table.edit')}
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader title={t('admin.hospitals.title')} subtitle={t('admin.hospitals.subtitle')} />

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
            <option value="approved">{t('admin.approvals.approved')}</option>
            <option value="pending">{t('admin.approvals.pending')}</option>
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
                      <td className={`${td} whitespace-nowrap`}>{hospital.district}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {hospital.license}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{hospital.contact}</td>
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
                    {t('admin.banks.contact')}: {hospital.contact}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setViewId(hospital.id)}>
                      {t('admin.table.view')}
                    </Button>
                    <Button
                      variant={hospital.status === 'approved' ? 'outline' : 'success'}
                      size="sm"
                      onClick={() => handleToggle(hospital)}
                    >
                      {hospital.status === 'approved'
                        ? t('admin.hospitals.deactivate')
                        : t('admin.hospitals.activate')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(hospital)}>
                      {t('admin.table.edit')}
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

      <Modal
        open={editing !== null}
        onClose={() => setEditId(null)}
        title={t('admin.table.edit')}
        subtitle={editing?.name}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('admin.banks.contact')} required error={editErrors.contact}>
            <Input
              value={editForm.contact}
              onChange={(e) => setEditField('contact', e.target.value)}
              error={editErrors.contact}
            />
          </Field>
          <Field label={t('admin.admins.email')} required error={editErrors.email}>
            <Input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditField('email', e.target.value)}
              error={editErrors.email}
            />
          </Field>
          <Field label="Address" required error={editErrors.address}>
            <Input
              value={editForm.address}
              onChange={(e) => setEditField('address', e.target.value)}
              error={editErrors.address}
            />
          </Field>
          <Field label="Admin Name" required error={editErrors.adminName}>
            <Input
              value={editForm.adminName}
              onChange={(e) => setEditField('adminName', e.target.value)}
              error={editErrors.adminName}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
