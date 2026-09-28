import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Plus, RefreshCw } from 'lucide-react';
import { DISTRICTS } from '../../data/constants';
import {
  createAdmin,
  listAdmins,
  resetAdminPin,
  updateAdmin,
} from '../../lib/api';
import type { AdminAccount } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
const td = 'px-4 py-3 text-sm text-slate-700 dark:text-slate-300';

const PAGE_SIZE = 10;

interface AdminForm {
  name: string;
  email: string;
  phone: string;
  district: string;
  role: string;
  status: 'active' | 'inactive';
}

type FormErrors = Partial<Record<'name' | 'email' | 'phone' | 'role', string>>;

export default function AdminsPage() {
  const { t } = useI18n();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [district, setDistrict] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [form, setForm] = useState<AdminForm>({
    name: '',
    email: '',
    phone: '',
    district: DISTRICTS[0] ?? '',
    role: '',
    status: 'active',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [confirmNode, ask] = useConfirm();

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
        const res = await listAdmins({
          search: debouncedSearch || undefined,
          district: district === 'all' ? undefined : district,
          page,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        setAdmins(res.data);
        setTotal(res.total ?? 0);
      } catch (e) {
        if (cancelled) return;
        setAdmins([]);
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
  }, [debouncedSearch, district, page, refreshNonce, t]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const refetch = () => setRefreshNonce((n) => n + 1);

  const filtered = useMemo(() => admins, [admins]);

  const setField = <K extends keyof AdminForm,>(key: K, value: AdminForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      district: DISTRICTS[0] ?? '',
      role: '',
      status: 'active',
    });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (admin: AdminAccount) => {
    setEditing(admin);
    setForm({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      district: admin.district,
      role: admin.role,
      status: admin.status,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = t('validation.required');
    if (!form.email.trim()) next.email = t('validation.required');
    if (!form.phone.trim()) next.phone = t('validation.required');
    if (!form.role.trim()) next.role = t('validation.required');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || saving) return;
    const cleaned = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      district: form.district,
      role: form.role.trim(),
      status: form.status,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateAdmin(editing.id, cleaned);
      } else {
        await createAdmin(cleaned);
      }
      toast.success(t('common.success'));
      setModalOpen(false);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const askToggleStatus = (admin: AdminAccount) => {
    const nextStatus = admin.status === 'active' ? 'inactive' : 'active';
    ask({
      title: t('admin.admins.confirmRemove'),
      message: t('admin.admins.confirmRemoveMsg', { name: admin.name }),
      confirmLabel: t('admin.table.remove'),
      destructive: true,
      onConfirm: async () => {
        setActingId(admin.id);
        try {
          await updateAdmin(admin.id, { status: nextStatus });
          toast.success(t('common.success'));
          refetch();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : t('common.error'));
        } finally {
          setActingId(null);
        }
      },
    });
  };

  const handleResetPin = async (admin: AdminAccount) => {
    setActingId(admin.id);
    try {
      const res = await resetAdminPin(admin.id);
      if (res.pin) {
        toast.success(`${t('common.success')}: ${res.pin}`);
      } else {
        toast.success(res.message || t('common.success'));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setActingId(null);
    }
  };

  const statusBadge = (s: AdminAccount['status']) =>
    s === 'active' ? (
      <Badge tone="emerald">{t('admin.admins.active')}</Badge>
    ) : (
      <Badge tone="slate">{t('admin.admins.inactive')}</Badge>
    );

  const renderRowActions = (admin: AdminAccount) => {
    const busy = actingId === admin.id;
    return (
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="outline" size="sm" onClick={() => openEdit(admin)} disabled={busy}>
          {t('admin.table.edit')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<KeyRound className="h-3.5 w-3.5" />}
          loading={busy}
          onClick={() => handleResetPin(admin)}
        >
          Reset PIN
        </Button>
        <Button
          variant={admin.status === 'active' ? 'danger' : 'success'}
          size="sm"
          disabled={busy}
          onClick={() => askToggleStatus(admin)}
        >
          {admin.status === 'active'
            ? t('admin.hospitals.deactivate')
            : t('admin.hospitals.activate')}
        </Button>
      </div>
    );
  };

  const renderBody = () => {
    if (loading && admins.length === 0) {
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
    if (filtered.length === 0) {
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
                <th className={th}>{t('admin.admins.adminId')}</th>
                <th className={th}>{t('admin.admins.name')}</th>
                <th className={th}>{t('admin.admins.email')}</th>
                <th className={th}>{t('admin.admins.phone')}</th>
                <th className={th}>{t('admin.admins.district')}</th>
                <th className={th}>{t('admin.admins.role')}</th>
                <th className={th}>{t('admin.admins.status')}</th>
                <th className={`${th} text-right`}>{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {filtered.map((admin) => (
                <tr
                  key={admin.id}
                  className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                    {admin.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                    {admin.name}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{admin.email}</td>
                  <td className={`${td} whitespace-nowrap`}>{admin.phone}</td>
                  <td className={`${td} whitespace-nowrap`}>{admin.district}</td>
                  <td className={`${td} whitespace-nowrap`}>{admin.role}</td>
                  <td className="whitespace-nowrap px-4 py-3">{statusBadge(admin.status)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{renderRowActions(admin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
          {filtered.map((admin) => (
            <div key={admin.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {admin.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {admin.id}
                  </p>
                </div>
                {statusBadge(admin.status)}
              </div>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{admin.email}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {admin.phone} · {admin.district} · {admin.role}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">{renderRowActions(admin)}</div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div>
      <PageHeader
        title={t('admin.admins.title')}
        subtitle={t('admin.admins.subtitle')}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={refetch}
              loading={loading && admins.length > 0}
            >
              {t('admin.messages.retry')}
            </Button>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
              {t('admin.admins.addAdmin')}
            </Button>
          </div>
        }
      />

      <Card padded={false} className="overflow-hidden">
        <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2">
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
            aria-label={t('admin.admins.district')}
          >
            <option value="all">{t('admin.table.allDistricts')}</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>

        {renderBody()}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 sm:px-1 dark:text-slate-400">
            {t('admin.table.showing', { count: filtered.length, total })}
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('admin.admins.editAdmin') : t('admin.admins.addAdmin')}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('admin.admins.name')} required error={errors.name}>
            <Input
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              error={errors.name}
            />
          </Field>
          <Field label={t('admin.admins.email')} required error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              error={errors.email}
            />
          </Field>
          <Field label={t('admin.admins.phone')} required error={errors.phone}>
            <Input
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              error={errors.phone}
            />
          </Field>
          <Field label={t('admin.admins.district')} required>
            <Select value={form.district} onChange={(e) => setField('district', e.target.value)}>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('admin.admins.role')} required error={errors.role}>
            <Input
              value={form.role}
              onChange={(e) => setField('role', e.target.value)}
              error={errors.role}
            />
          </Field>
          <Field label={t('admin.admins.status')} required>
            <Select
              value={form.status}
              onChange={(e) => setField('status', e.target.value as AdminForm['status'])}
            >
              <option value="active">{t('admin.admins.active')}</option>
              <option value="inactive">{t('admin.admins.inactive')}</option>
            </Select>
          </Field>
        </div>
      </Modal>

      {confirmNode}
    </div>
  );
}
