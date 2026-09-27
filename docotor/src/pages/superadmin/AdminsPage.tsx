import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { DISTRICTS } from '../../data/constants';
import { MANAGED_ADMINS } from '../../data/superadminMock';
import type { ManagedAdmin } from '../../data/superadminMock';
import { useI18n } from '../../i18n/I18nContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
const td = 'px-4 py-3 text-sm text-slate-700 dark:text-slate-300';

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
  const [admins, setAdmins] = useState<ManagedAdmin[]>(MANAGED_ADMINS);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedAdmin | null>(null);
  const [form, setForm] = useState<AdminForm>({
    name: '',
    email: '',
    phone: '',
    district: DISTRICTS[0] ?? '',
    role: '',
    status: 'active',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmNode, ask] = useConfirm();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return admins.filter((a) => {
      if (q && !`${a.name} ${a.email} ${a.id}`.toLowerCase().includes(q)) return false;
      if (district !== 'all' && a.district !== district) return false;
      return true;
    });
  }, [admins, search, district]);

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

  const openEdit = (admin: ManagedAdmin) => {
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

  const handleSave = () => {
    if (!validate()) return;
    const cleaned: AdminForm = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      district: form.district,
      role: form.role.trim(),
      status: form.status,
    };
    if (editing) {
      setAdmins((prev) => prev.map((a) => (a.id === editing.id ? { ...a, ...cleaned } : a)));
    } else {
      const id = `ADM-${Date.now().toString().slice(-4)}`;
      setAdmins((prev) => [...prev, { id, ...cleaned }]);
    }
    toast.success(t('common.success'));
    setModalOpen(false);
  };

  const askRemove = (admin: ManagedAdmin) =>
    ask({
      title: t('admin.admins.confirmRemove'),
      message: t('admin.admins.confirmRemoveMsg', { name: admin.name }),
      confirmLabel: t('admin.table.remove'),
      destructive: true,
      onConfirm: () => {
        setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
        toast.success(t('common.success'));
      },
    });

  const statusBadge = (s: ManagedAdmin['status']) =>
    s === 'active' ? (
      <Badge tone="emerald">{t('admin.admins.active')}</Badge>
    ) : (
      <Badge tone="slate">{t('admin.admins.inactive')}</Badge>
    );

  return (
    <div>
      <PageHeader
        title={t('admin.admins.title')}
        subtitle={t('admin.admins.subtitle')}
        action={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            {t('admin.admins.addAdmin')}
          </Button>
        }
      />

      <Card padded={false} className="overflow-hidden">
        <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.table.searchPh')}
            aria-label={t('admin.table.searchPh')}
          />
          <Select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
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
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => openEdit(admin)}>
                            {t('admin.table.edit')}
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => askRemove(admin)}>
                            {t('admin.table.remove')}
                          </Button>
                        </div>
                      </td>
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
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => openEdit(admin)}>
                      {t('admin.table.edit')}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => askRemove(admin)}>
                      {t('admin.table.remove')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="border-t border-slate-200 px-4 py-3 text-xs font-medium text-slate-500 sm:px-5 dark:border-slate-800 dark:text-slate-400">
          {t('admin.table.showing', { count: filtered.length, total: admins.length })}
        </p>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('admin.admins.editAdmin') : t('admin.admins.addAdmin')}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave}>
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
