import { useState } from 'react';
import { Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Field, Input } from '../../components/ui/Input';

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const lastLogin = new Date().toLocaleString(locale === 'ta' ? 'ta-IN' : 'en-IN');
  const initials = user?.name?.trim()?.charAt(0)?.toUpperCase() || '?';

  const closeModal = () => {
    setOpen(false);
    setCurrent('');
    setNext('');
    setConfirm('');
  };

  const handleUpdate = () => {
    if (!current.trim() || !next.trim() || !confirm.trim()) {
      toast.error(t('validation.required'));
      return;
    }
    if (next.length < 8) {
      toast.error(t('admin.profile.tooShort'));
      return;
    }
    if (next !== confirm) {
      toast.error(t('admin.profile.mismatch'));
      return;
    }
    toast.success(t('admin.profile.updated' as TranslationKey));
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
      <PageHeader title={t('admin.profile.title')} subtitle={t('admin.profile.subtitle')} />

      <Card>
        <CardHeader
          icon={<User className="h-4.5 w-4.5" />}
          title={t('admin.profile.title')}
          action={
            <Button
              variant="outline"
              size="sm"
              icon={<Lock className="h-3.5 w-3.5" />}
              onClick={() => setOpen(true)}
            >
              {t('admin.profile.changePassword')}
            </Button>
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
            <div className="mt-2">
              <Badge tone="red" dot>
                {user?.role || '—'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
          {row(t('admin.profile.name'), user?.name || '—')}
          {row(t('admin.profile.adminId'), user?.id || '—')}
          {row(t('admin.profile.email'), 'superadmin@lifesaver.in')}
          {row(t('admin.profile.phone'), '+91 98400 00001')}
          {row(t('admin.profile.role'), user?.role || '—')}
          {row(t('admin.profile.lastLogin'), lastLogin)}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={closeModal}
        title={t('admin.profile.changePassword')}
        subtitle={t('admin.profile.subtitle')}
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdate}>{t('admin.profile.update')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('admin.profile.currentPassword')}>
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <Field label={t('admin.profile.newPassword')}>
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label={t('admin.profile.confirmPassword')}>
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
