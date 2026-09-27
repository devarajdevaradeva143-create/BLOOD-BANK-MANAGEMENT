import { useEffect, useState } from 'react';
import { Lock, Pencil, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Field, Input } from '../components/ui/Input';

function defaultEmail(id: string): string {
  return `${id.toLowerCase()}@lifesaver.in`;
}

function defaultPhone(id: string): string {
  if (id === 'DIST-001') return '+91 98400 00002';
  if (id === 'SUPER001') return '+91 98400 00001';
  return '+91 98400 00000';
}

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { user, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const userId = user?.id;

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? (user ? defaultEmail(user.id) : ''));
    setPhone(user?.phone ?? (user ? defaultPhone(user.id) : ''));
    setErrors({});
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const emailValue = email || (user ? defaultEmail(user.id) : '');
  const phoneValue = phone || (user ? defaultPhone(user.id) : '');
  const lastLogin = new Date().toLocaleString(locale === 'ta' ? 'ta-IN' : 'en-IN');
  const initials = user?.name?.trim()?.charAt(0)?.toUpperCase() || '?';
  const roleLabel =
    user?.role === 'DistrictAdmin'
      ? t('login.demoDistrictAdmin')
      : user?.role === 'SuperAdmin'
        ? t('login.demoSuperAdmin')
        : user?.role || '—';

  const startEdit = () => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? (user ? defaultEmail(user.id) : ''));
    setPhone(user?.phone ?? (user ? defaultPhone(user.id) : ''));
    setErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? (user ? defaultEmail(user.id) : ''));
    setPhone(user?.phone ?? (user ? defaultPhone(user.id) : ''));
    setErrors({});
    setEditing(false);
  };

  const handleSave = () => {
    const nextErrors: { name?: string; email?: string; phone?: string } = {};
    if (!name.trim()) {
      nextErrors.name = t('validation.required');
    }
    if (!emailValue.trim()) {
      nextErrors.email = t('validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim())) {
      nextErrors.email = t('profile.invalidEmail');
    }
    const digits = phoneValue.replace(/\D/g, '');
    if (!phoneValue.trim()) {
      nextErrors.phone = t('validation.required');
    } else if (digits.length < 7) {
      nextErrors.phone = t('profile.invalidPhone');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateProfile({ name: name.trim(), email: emailValue.trim(), phone: phoneValue.trim() });
    toast.success(t('profile.editSuccess'));
    setEditing(false);
  };

  const closeModal = () => {
    setOpen(false);
    setCurrent('');
    setNext('');
    setConfirm('');
  };

  const handlePasswordUpdate = () => {
    if (!current.trim() || !next.trim() || !confirm.trim()) {
      toast.error(t('validation.required'));
      return;
    }
    if (next.length < 8) {
      toast.error(t('profile.tooShort'));
      return;
    }
    if (next !== confirm) {
      toast.error(t('profile.mismatch'));
      return;
    }
    toast.success(t('profile.updated'));
    closeModal();
  };

  const row = (label: string, value: string) => (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );

  return (
    <div>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

      <Card>
        <CardHeader
          icon={<User className="h-4.5 w-4.5" />}
          title={t('profile.title')}
          subtitle={t('profile.subtitle')}
          action={
            <div className="flex flex-wrap items-center gap-2">
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEdit}>
                    {t('profile.cancel')}
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    {t('profile.save')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={startEdit}
                  >
                    {t('profile.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Lock className="h-3.5 w-3.5" />}
                    onClick={() => setOpen(true)}
                  >
                    {t('profile.changePassword')}
                  </Button>
                </>
              )}
            </div>
          }
        />

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-lg font-semibold text-white shadow-sm shadow-red-600/20">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
              {user?.name || '—'}
            </p>
            <p className="mt-0.5 font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
              {user?.id || '—'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="red" dot>
                {roleLabel}
              </Badge>
              <Badge tone="slate">{user?.designation || t('details.noValue')}</Badge>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('profile.name')} required error={errors.name}>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" error={errors.name} />
            </Field>
            <Field label={t('profile.staffId')}>
              <Input value={user?.id ?? ''} disabled readOnly className="opacity-70" />
            </Field>
            <Field label={t('profile.email')} required error={errors.email}>
              <Input
                type="email"
                value={emailValue}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                error={errors.email}
              />
            </Field>
            <Field label={t('profile.phone')} required error={errors.phone}>
              <Input
                type="tel"
                value={phoneValue}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                error={errors.phone}
              />
            </Field>
            <Field label={t('profile.role')}>
              <Input value={roleLabel} disabled readOnly className="opacity-70" />
            </Field>
            <Field label={t('profile.designation')}>
              <Input value={user?.designation || ''} disabled readOnly className="opacity-70" />
            </Field>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
            {row(t('profile.name'), user?.name || '—')}
            {row(t('profile.staffId'), user?.id || '—')}
            {row(t('profile.email'), user?.email || (user ? defaultEmail(user.id) : '—'))}
            {row(t('profile.phone'), user?.phone || (user ? defaultPhone(user.id) : '—'))}
            {row(t('profile.role'), roleLabel)}
            {row(t('profile.designation'), user?.designation || '—')}
            {row(t('profile.lastLogin'), lastLogin)}
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={closeModal}
        title={t('profile.changePassword')}
        subtitle={t('profile.subtitle')}
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handlePasswordUpdate}>{t('profile.update')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('profile.currentPassword')}>
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <Field label={t('profile.newPassword')}>
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label={t('profile.confirmPassword')}>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
