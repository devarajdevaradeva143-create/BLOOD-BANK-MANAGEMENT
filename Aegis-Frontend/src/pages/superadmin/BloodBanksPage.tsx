import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw } from 'lucide-react';
import { DISTRICTS } from '../../data/constants';
import {
  createBloodBank,
  listBloodBanks,
  updateBloodBank,
} from '../../lib/api';
import type { BloodBank } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

type StatusFilter = 'all' | BloodBank['status'];

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
const td = 'px-4 py-3 text-sm text-slate-700 dark:text-slate-300';

const PAGE_SIZE = 10;

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
  status: BloodBank['status'];
}

interface BankCreateForm {
  name: string;
  district: string;
  contact: string;
  units: string;
  status: BloodBank['status'];
}

type EditErrors = Partial<Record<'contact' | 'units', string>>;
type CreateErrors = Partial<Record<'name' | 'contact' | 'units', string>>;

export default function BloodBanksPage() {
  const { t } = useI18n();
  const [banks, setBanks] = useState<BloodBank[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<BankCreateForm>({
    name: '',
    district: DISTRICTS[0] ?? '',
    contact: '',
    units: '',
    status: 'active',
  });
  const [createErrors, setCreateErrors] = useState<CreateErrors>({});
  const [creating, setCreating] = useState(false);

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
        const res = await listBloodBanks({
          search: debouncedSearch || undefined,
          district: district === 'all' ? undefined : district,
          status: status === 'all' ? undefined : status,
          page,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        setBanks(res.data);
        setTotal(res.total ?? 0);
      } catch (e) {
        if (cancelled) return;
        setBanks([]);
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
  }, [debouncedSearch, district, status, page, refreshNonce, t]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const viewing = useMemo(() => banks.find((b) => b.id === viewId) ?? null, [banks, viewId]);
  const editing = useMemo(() => banks.find((b) => b.id === editId) ?? null, [banks, editId]);

  const refetch = () => setRefreshNonce((n) => n + 1);

  function statusTone(s: BloodBank['status']): 'emerald' | 'slate' | 'amber' {
    if (s === 'active') return 'emerald';
    if (s === 'maintenance') return 'amber';
    return 'slate';
  }

  function statusLabel(s: BloodBank['status']): string {
    if (s === 'active') return t('admin.admins.active');
    if (s === 'inactive') return t('admin.admins.inactive');
    return 'Maintenance';
  }

  const openEdit = (bank: BloodBank) => {
    setEditId(bank.id);
    setEditForm({ contact: bank.contact, units: String(bank.units), status: bank.status });
    setEditErrors({});
  };

  const handleSaveEdit = async () => {
    if (!editing || saving) return;
    const next: EditErrors = {};
    if (!editForm.contact.trim()) next.contact = t('validation.required');
    if (!editForm.units.trim()) next.units = t('validation.required');
    setEditErrors(next);
    if (Object.keys(next).length > 0) return;
    const parsed = Number(editForm.units);
    const units = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    setSaving(true);
    try {
      await updateBloodBank(editing.id, {
        contact: editForm.contact.trim(),
        units,
        status: editForm.status,
      });
      toast.success(t('common.success'));
      setEditId(null);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setCreateForm({
      name: '',
      district: DISTRICTS[0] ?? '',
      contact: '',
      units: '',
      status: 'active',
    });
    setCreateErrors({});
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (creating) return;
    const next: CreateErrors = {};
    if (!createForm.name.trim()) next.name = t('validation.required');
    if (!createForm.contact.trim()) next.contact = t('validation.required');
    if (!createForm.units.trim()) next.units = t('validation.required');
    setCreateErrors(next);
    if (Object.keys(next).length > 0) return;
    const parsed = Number(createForm.units);
    const units = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    setCreating(true);
    try {
      await createBloodBank({
        name: createForm.name.trim(),
        district: createForm.district,
        contact: createForm.contact.trim(),
        units,
        status: createForm.status,
      });
      toast.success(t('common.success'));
      setCreateOpen(false);
      setPage(1);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setCreating(false);
    }
  };

  const renderBody = () => {
    if (loading && banks.length === 0) {
      return (
        <div className="flex items-center justify-center gap-3 border-t border-slate-200 py-12 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <Spinner />
          <span className="text-sm">{t('common.loading')}</span>
        </div>
      );
    }
    if (error) {
      return (
        <div className="border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              {t('admin.messages.retry')}
            </Button>
          </div>
          <EmptyState title={t('admin.table.noResults')} hint={t('admin.table.noResultsHint')} />
        </div>
      );
    }
    if (banks.length === 0) {
      return (
        <div className="border-t border-slate-200 dark:border-slate-800">
          <EmptyState title={t('admin.table.noResults')} hint={t('admin.table.noResultsHint')} />
        </div>
      );
    }
    return (
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
              {banks.map((bank) => (
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
          {banks.map((bank) => (
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
    );
  };

  return (
    <div>
      <PageHeader
        title={t('admin.banks.title')}
        subtitle={t('admin.banks.subtitle')}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={refetch}
              loading={loading && banks.length > 0}
            >
              {t('admin.messages.retry')}
            </Button>
            <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              {t('admin.table.add')}
            </Button>
          </div>
        }
      />

      <Card padded={false} className="overflow-hidden">
        <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-3">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('admin.table.searchPh')}
            aria-label={t('admin.table.searchPh')}
          />
          <Select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setPage(1);
            }}
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
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setPage(1);
            }}
            aria-label={t('admin.banks.status')}
          >
            <option value="all">{t('admin.table.allStatus')}</option>
            <option value="active">{t('admin.admins.active')}</option>
            <option value="inactive">{t('admin.admins.inactive')}</option>
            <option value="maintenance">Maintenance</option>
          </Select>
        </div>

        {renderBody()}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 sm:px-1 dark:text-slate-400">
            {t('admin.table.showing', { count: banks.length, total })}
          </p>
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
              ›
            </Button>
          </div>
        </div>
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
            <Button variant="outline" onClick={() => setEditId(null)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSaveEdit} loading={saving}>
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
                  status: e.target.value as BloodBank['status'],
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

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('admin.table.add')}
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleCreate} loading={creating}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('admin.banks.name')} required error={createErrors.name}>
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
              error={createErrors.name}
            />
          </Field>
          <Field label={t('admin.banks.district')} required>
            <Select
              value={createForm.district}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, district: e.target.value }))}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('admin.banks.contact')} required error={createErrors.contact}>
            <Input
              value={createForm.contact}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, contact: e.target.value }))}
              error={createErrors.contact}
            />
          </Field>
          <Field label={t('admin.banks.units')} required error={createErrors.units}>
            <Input
              type="number"
              min={0}
              value={createForm.units}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, units: e.target.value }))}
              error={createErrors.units}
            />
          </Field>
          <Field label={t('admin.banks.status')} required>
            <Select
              value={createForm.status}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  status: e.target.value as BloodBank['status'],
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
