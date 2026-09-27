import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Droplet, Eye, EyeOff, LockKeyhole, Moon, ShieldCheck, Sun, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DEMO_ACCOUNTS } from '../data/constants';
import type { DemoAccount } from '../data/constants';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { user, login } = useAuth();
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<DemoAccount['role'] | null>(null);

  if (user) return <Navigate to="/dashboard" replace />;

  const attemptLogin = async (id: string, pinCode: string) => {
    const ok = await login(id, pinCode, remember);
    if (ok) {
      toast.success(t('login.title'));
      navigate('/dashboard', { replace: true });
      return true;
    }
    setError(t('login.errorInvalid'));
    return false;
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    setStaffId(account.staffId);
    setPin(account.pin);
    setError('');
    setDemoLoading(account.role);
    try {
      await attemptLogin(account.staffId, account.pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorInvalid'));
    } finally {
      setDemoLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!staffId.trim() || !pin.trim()) {
      setError(t('login.errorRequired'));
      return;
    }
    setLoading(true);
    try {
      await attemptLogin(staffId.trim(), pin.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="relative hidden w-full overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-rose-800 lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
            <Droplet className="h-6 w-6 text-white" fill="currentColor" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{t('app.name')}</p>
            <p className="text-xs text-red-100/90">{t('app.sub')}</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="max-w-md text-3xl font-semibold leading-tight text-white xl:text-4xl">
            {t('app.tagline')}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-red-50/90">
            {t('login.subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {['Rack A', '-80°C FFP', 'Screened', 'Tamil + English'].map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/20"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-red-100/80">
          <ShieldCheck className="h-4 w-4" />
          {t('login.secure')}
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600">
                <Droplet className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('app.name')}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('app.sub')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="ml-auto rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
              aria-label={theme === 'dark' ? t('settings.light') : t('settings.dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('login.title')}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('login.subtitle')}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="staffId" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  {t('login.staffId')}
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="staffId"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder={t('login.staffIdPh')}
                    autoComplete="username"
                    className="pl-9"
                    error={error && !staffId.trim() ? t('validation.required') : undefined}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="pin" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  {t('login.pin')}
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder={t('login.pinPh')}
                    autoComplete="current-password"
                    className="pl-9 pr-10"
                    error={error && !pin.trim() ? t('validation.required') : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPin ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800"
                  />
                  {t('login.remember')}
                </label>
              </div>

              {error ? (
                <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
                  {error}
                </p>
              ) : null}

              <Button type="submit" fullWidth size="lg" loading={loading}>
                {loading ? t('login.signingIn') : t('login.submit')}
              </Button>
            </form>

            <div className="mt-6 border-t border-dashed border-slate-200 pt-4 dark:border-slate-700">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t('login.demoTitle')}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{t('login.demoHint')}</p>
              </div>
              <div className="mt-3 space-y-2">
                {DEMO_ACCOUNTS.map((account) => {
                  const isActive = demoLoading === account.role;
                  return (
                    <div
                      key={account.role}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                          {t(account.role === 'Doctor' ? 'login.demoDoctor' : 'login.demoStaff')}
                        </p>
                        <p className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {account.staffId} / {account.pin}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        loading={isActive}
                        disabled={loading || demoLoading !== null}
                        onClick={() => void handleDemoLogin(account)}
                      >
                        {t('login.demoUse')}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-600">
            {t('login.secure')}
          </p>
        </div>
      </div>
    </div>
  );
}
