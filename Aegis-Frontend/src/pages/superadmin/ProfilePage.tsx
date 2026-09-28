import { useEffect, useState } from 'react';
import { Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { changePassword, fetchMe, updateProfile as updateProfileApi } from '../../lib/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Field, Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

export default function ProfilePage() {
  const { t } = useI18n();
  const { user, updateProfile: syncAuthProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileErrors, setProfileErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [profileSaving, setProfileSaving] = useState(false);

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setRefreshing(true);
      setLoadError(null);
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setProfileName(me.name ?? '');
        setProfileEmail(me.email ?? '');
        setProfilePhone(me.phone ?? '');
        syncAuthProfile({ name: me.name, email: me.email, phone: me.phone });
      } catch (e) {
        if (cancelled) return;
        // Fall back to the session user — never fake data.
        setProfileName(user?.name ?? '');
        setProfileEmail(user?.email ?? '');
        setProfilePhone(user?.phone ?? '');
        setLoadError(e instanceof Error ? e.message : t('common.error'));
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = (profileName || user?.name || '').trim().charAt(0)?.toUpperCase() || '?';

  const closeModal = () => {
    setOpen(false);
    setCurrent('');
    setNext('');
    setConfirm('');
  };

  const handleProfileSave = async () => {
    const errs: { name?: string; email?: string; phone?: string } = {};
    if (!profileName.trim()) errs.name = t('validation.required');
    if (profileEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail.trim()))
      errs.email = t('profile.invalidEmail');
    setProfileErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setProfileSaving(true);
    try {
      const updated = await updateProfileApi({
        name: profileName.trim(),
        email: profileEmail.trim() || undefined,
        phone: profilePhone.trim() || undefined,
      });
      setProfileName(updated.name ?? profileName.trim());
      setProfileEmail(updated.email ?? profileEmail.trim());
      setProfilePhone(updated.phone ?? profilePhone.trim());
      syncAuthProfile({
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
      });
      toast.success(t('profile.editSuccess'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdate = async () => {
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
    setPwSaving(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      toast.success(t('profile.updated'));
      closeModal();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setPwSaving(false);
    }
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

      {loadError ? (
        <Card className="mb-4 border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40">
          <p role="alert" className="text-xs font-medium text-rose-700 dark:text-rose-300">
            {loadError}
          </p>
        </Card>
      ) : null}

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
        {refreshing ? (
          <div className="flex items-center justify-center gap-3 py-10 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        ) : !user && !profileName ? (
          <EmptyState title={t('admin.table.noResults')} hint={loadError ?? undefined} />
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-lg font-semibold text-white shadow-sm shadow-red-600/20">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                  {profileName || user?.name || '—'}
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
              {row(t('admin.profile.name'), profileName || user?.name || '—')}
              {row(t('admin.profile.adminId'), user?.id || '—')}
              {row(t('admin.profile.email'), profileEmail || user?.email || '—')}
              {row(t('admin.profile.phone'), profilePhone || user?.phone || '—')}
              {row(t('admin.profile.role'), user?.role || '—')}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('profile.edit')}
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('admin.profile.name')} required error={profileErrors.name}>
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    error={profileErrors.name}
                    autoComplete="name"
                  />
                </Field>
                <Field label={t('admin.profile.email')} error={profileErrors.email}>
                  <Input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    error={profileErrors.email}
                    autoComplete="email"
                  />
                </Field>
                <Field label={t('admin.profile.phone')} error={profileErrors.phone}>
                  <Input
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    error={profileErrors.phone}
                    autoComplete="tel"
                  />
                </Field>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="primary" size="sm" onClick={handleProfileSave} loading={profileSaving}>
                  {t('profile.save')}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={open}
        onClose={closeModal}
        title={t('admin.profile.changePassword')}
        subtitle={t('admin.profile.subtitle')}
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={pwSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdate} loading={pwSaving}>
              {t('admin.profile.update')}
            </Button>
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
