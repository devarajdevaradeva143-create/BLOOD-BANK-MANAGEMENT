import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Droplet,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sun,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

const DEMO_ID = 'SUPER001';
const DEMO_PASSWORD = 'Admin@123';

export default function SuperAdminLoginPage() {
  const { user, login } = useAuth();
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  if (user?.role === 'SuperAdmin') return <Navigate to="/superadmin/dashboard" replace />;
  if (user) return <Navigate to="/dashboard" replace />;

  const attemptLogin = async (id: string, pwd: string) => {
    const ok = await login(id, pwd, remember);
    if (ok) {
      toast.success(t('admin.login.title'));
      navigate('/superadmin/dashboard', { replace: true });
      return true;
    }
    setError(t('admin.login.errorInvalid'));
    return false;
  };

  const handleDemoLogin = async () => {
    setAdminId(DEMO_ID);
    setPassword(DEMO_PASSWORD);
    setError('');
    setDemoLoading(true);
    try {
      await attemptLogin(DEMO_ID, DEMO_PASSWORD);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.login.errorInvalid'));
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!adminId.trim() || !password.trim()) {
      setError(t('admin.login.errorRequired'));
      return;
    }
    setLoading(true);
    try {
      await attemptLogin(adminId.trim(), password.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.login.errorInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="relative hidden w-full overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-rose-950 lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/25 blur-3xl"
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
            {t('admin.login.subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {['Network', '38 Districts', 'Live Stock', 'Tamil + English'].map((chip) => (
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
          {t('admin.login.secure')}
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-700">
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
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {t('admin.login.title')}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('admin.login.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="adminId"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  {t('admin.login.adminId')}
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="adminId"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder={t('admin.login.adminIdPh')}
                    autoComplete="username"
                    className="pl-9"
                    error={error && !adminId.trim() ? t('validation.required') : undefined}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  {t('admin.login.password')}
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('admin.login.passwordPh')}
                    autoComplete="current-password"
                    className="pl-9 pr-10"
                    error={error && !password.trim() ? t('validation.required') : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  {t('admin.login.remember')}
                </label>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"
                >
                  {error}
                </p>
              ) : null}

              <Button type="submit" fullWidth size="lg" loading={loading}>
                {loading ? t('admin.login.signingIn') : t('admin.login.submit')}
              </Button>
            </form>

            <div className="mt-6 border-t border-dashed border-slate-200 pt-4 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('admin.login.demoTitle')}
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      Super Admin
                    </p>
                    <p className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {DEMO_ID} / {DEMO_PASSWORD}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={demoLoading}
                    disabled={loading || demoLoading}
                    onClick={() => void handleDemoLogin()}
                  >
                    Use
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => navigate('/login')}
              >
                {t('admin.login.backHome')}
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-600">
            {t('admin.login.secure')}
          </p>
        </div>
      </div>
    </div>
  );
}
