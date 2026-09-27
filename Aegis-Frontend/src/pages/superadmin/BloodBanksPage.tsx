import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { DISTRICTS } from '../../data/constants';
import { BLOOD_BANKS } from '../../data/superadminMock';
import type { BloodBankRow } from '../../data/superadminMock';
import { useI18n } from '../../i18n/I18nContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';

type StatusFilter = 'all' | BloodBankRow['status'];

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

interface BankEditForm {
  contact: string;
  units: string;
  status: BloodBankRow['status'];
}

type EditErrors = Partial<Record<'contact' | 'units', string>>;

export default function BloodBanksPage() {
  const { t } = useI18n();
  const [banks, setBanks] = useState<BloodBankRow[]>(BLOOD_BANKS);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BankEditForm>({
    contact: '',
    units: '',
    status: 'active',
  });
  const [editErrors, setEditErrors] = useState<EditErrors>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return banks.filter((b) => {
      if (q && !`${b.name} ${b.id}`.toLowerCase().includes(q)) return false;
      if (district !== 'all' && b.district !== district) return false;
      if (status !== 'all' && b.status !== status) return false;
      return true;
    });
  }, [banks, search, district, status]);

  const viewing = banks.find((b) => b.id === viewId) ?? null;
  const editing = banks.find((b) => b.id === editId) ?? null;

  function statusTone(s: BloodBankRow['status']): 'emerald' | 'slate' | 'amber' {
    if (s === 'active') return 'emerald';
    if (s === 'maintenance') return 'amber';
    return 'slate';
  }

  function statusLabel(s: BloodBankRow['status']): string {
    if (s === 'active') return t('admin.admins.active');
    if (s === 'inactive') return t('admin.admins.inactive');
    return 'Maintenance';
  }

  const openEdit = (bank: BloodBankRow) => {
    setEditId(bank.id);
    setEditForm({ contact: bank.contact, units: String(bank.units), status: bank.status });
    setEditErrors({});
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    const next: EditErrors = {};
    if (!editForm.contact.trim()) next.contact = t('validation.required');
    if (!editForm.units.trim()) next.units = t('validation.required');
    setEditErrors(next);
    if (Object.keys(next).length > 0) return;
    const parsed = Number(editForm.units);
    const units = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    setBanks((prev) =>
      prev.map((b) =>
        b.id === editing.id
          ? { ...b, contact: editForm.contact.trim(), units, status: editForm.status }
          : b,
      ),
    );
    toast.success(t('common.success'));
    setEditId(null);
  };

  return (
    <div>
      <PageHeader title={t('admin.banks.title')} subtitle={t('admin.banks.subtitle')} />

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
            aria-label={t('admin.banks.district')}
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
            aria-label={t('admin.banks.status')}
          >
            <option value="all">{t('admin.table.allStatus')}</option>
            <option value="active">{t('admin.admins.active')}</option>
            <option value="inactive">{t('admin.admins.inactive')}</option>
            <option value="maintenance">Maintenance</option>
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
                    <th className={th}>{t('admin.banks.name')}</th>
                    <th className={th}>{t('admin.banks.district')}</th>
                    <th className={th}>{t('admin.banks.contact')}</th>
                    <th className={th}>{t('admin.banks.units')}</th>
                    <th className={th}>{t('admin.banks.status')}</th>
                    <th className={`${th} text-right`}>{t('admin.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {filtered.map((bank) => (
                    <tr
                      key={bank.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                        {bank.name}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{bank.district}</td>
                      <td className={`${td} whitespace-nowrap`}>{bank.contact}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                        {bank.units}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={statusTone(bank.status)}>{statusLabel(bank.status)}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => setViewId(bank.id)}>
                            {t('admin.table.view')}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEdit(bank)}>
                            {t('admin.table.edit')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {filtered.map((bank) => (
                <div key={bank.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {bank.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {bank.id}
                      </p>
                    </div>
                    <Badge tone={statusTone(bank.status)}>{statusLabel(bank.status)}</Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {bank.district} · {bank.contact}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {t('admin.banks.units')}: {bank.units}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setViewId(bank.id)}>
                      {t('admin.table.view')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(bank)}>
                      {t('admin.table.edit')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="border-t border-slate-200 px-4 py-3 text-xs font-medium text-slate-500 sm:px-5 dark:border-slate-800 dark:text-slate-400">
          {t('admin.table.showing', { count: filtered.length, total: banks.length })}
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
            <Detail label={t('admin.banks.name')} value={viewing.name} />
            <Detail label={t('admin.banks.district')} value={viewing.district} />
            <Detail label={t('admin.banks.contact')} value={viewing.contact} />
            <Detail label={t('admin.banks.units')} value={viewing.units} />
            <Detail
              label={t('admin.banks.status')}
              value={
                <Badge tone={statusTone(viewing.status)}>{statusLabel(viewing.status)}</Badge>
              }
            />
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
              onChange={(e) => setEditForm((prev) => ({ ...prev, contact: e.target.value }))}
              error={editErrors.contact}
            />
          </Field>
          <Field label={t('admin.banks.units')} required error={editErrors.units}>
            <Input
              type="number"
              min={0}
              value={editForm.units}
              onChange={(e) => setEditForm((prev) => ({ ...prev, units: e.target.value }))}
              error={editErrors.units}
            />
          </Field>
          <Field label={t('admin.banks.status')} required>
            <Select
              value={editForm.status}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  status: e.target.value as BloodBankRow['status'],
                }))
              }
            >
              <option value="active">{t('admin.admins.active')}</option>
              <option value="inactive">{t('admin.admins.inactive')}</option>
              <option value="maintenance">Maintenance</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
