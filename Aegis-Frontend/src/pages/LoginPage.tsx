import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import {
  ArrowRight,
  Droplet,
  Eye,
  EyeOff,
  FlaskConical,
  HeartHandshake,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  TriangleAlert,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
// TEMP-DEMO-LOGIN: frontend-only demo login (no backend).
import { DEMO_LOGIN_ENABLED } from '../lib/demo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import AuthSidePanel from '../components/layout/AuthSidePanel';
import { getPublicStats, type PublicStats } from '../lib/api';
import { DISTRICTS } from '../data/constants';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { user, login, demoLogin } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [staffError, setStaffError] = useState('');
  const [pinError, setPinError] = useState('');
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveStats, setLiveStats] = useState<PublicStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Public network stats for the side panel — backend reachable na live numbers,
  // illana neutral placeholder. No hardcoded marketing figures.
  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);    getPublicStats()
      .then((s) => {
        if (!cancelled) setLiveStats(s);
      })
      .catch(() => {
        if (!cancelled) setLiveStats(null);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Login page scrolls normally but the page scrollbar stays hidden.
  useEffect(() => {
    document.documentElement.classList.add('scrollbar-hidden');
    return () => {
      document.documentElement.classList.remove('scrollbar-hidden');
    };
  }, []);

  if (user?.role === 'SuperAdmin') return <Navigate to="/superadmin/dashboard" replace />;
  if (user) return <Navigate to="/dashboard" replace />;

  const fmt = (n: number | undefined) =>
    typeof n === 'number' ? n.toLocaleString('en-IN') : '—';

  const attemptLogin = async (id: string, pinCode: string) => {
    const account = await login(id, pinCode, remember);
    if (account) {
      toast.success(t('login.title'));
      // Same login page serves every role — route SuperAdmin to its dashboard.
      if (account.role === 'SuperAdmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      return true;
    }
    setError(t('login.errorInvalid'));
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const id = staffId.trim();
    const code = pin.trim();
    const nextStaffError = id ? '' : t('validation.required');
    const nextPinError = code ? '' : t('validation.required');
    setStaffError(nextStaffError);
    setPinError(nextPinError);
    if (nextStaffError || nextPinError) {
      setError(t('login.errorRequired'));
      return;
    }
    setLoading(true);
    try {
      await attemptLogin(id, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorInvalid'));
    } finally {
      setLoading(false);
    }
  };

  // TEMP-DEMO-LOGIN: frontend-only demo sign-in (no backend).
  const handleDemoLogin = (role: 'DistrictAdmin' | 'SuperAdmin') => {
    if (loading) return;
    setError('');
    const account = demoLogin(role);
    if (!account) {
      setError(t('login.errorInvalid'));
      return;
    }
    toast.success(t('login.title'));
    if (account.role === 'SuperAdmin') navigate('/superadmin/dashboard', { replace: true });
    else navigate('/dashboard', { replace: true });
  };

  const handleCapsLock = (e: React.KeyboardEvent) => {
    try {
      const on = e.getModifierState?.('CapsLock') ?? false;
      setCapsLockOn(on);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <AuthSidePanel
        eyebrow="District Admin Portal"
        orgName={t('app.name')}
        orgSub={t('app.sub')}
        headline={t('app.tagline')}
        description={t('login.subtitle')}
        isLoading={statsLoading}
        stats={[
          { icon: MapPin, value: String(DISTRICTS.length), label: 'Districts Covered' },
          { icon: Droplet, value: fmt(liveStats?.availableUnits), label: 'Units Available' },
          { icon: HeartHandshake, value: fmt(liveStats?.livesSupported), label: 'Lives Supported' },
          { icon: PackageCheck, value: fmt(liveStats?.fulfilledUnits), label: 'Requests Fulfilled' },
        ]}
        features={[
          'District-scoped admin access with secure PIN login',
          'Donor map with home-collection trip planning',
          'Tamil + English support for district admins',
        ]}
        helplineLabel="Emergency Helpline"
        helplineValue="104 • Toll Free"
        location="Chennai, TN"
        secureNote={t('login.secure')}
      />

      <div className="relative flex w-full flex-col lg:w-[48%]">
        {/* soft professional backdrop */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-red-500/[0.07] blur-3xl dark:bg-red-500/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-rose-500/[0.06] blur-3xl dark:bg-rose-500/10"
          aria-hidden="true"
        />

        {/* utility bar: brand / trust */}
        <div className="relative z-10 flex shrink-0 items-center gap-3 px-6 pt-5 sm:px-10">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-700 shadow-md shadow-red-600/25">
              <Droplet className="h-4 w-4 text-white" fill="currentColor" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-white">
                {t('app.name')}
              </p>
              <p className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {t('app.sub')}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 rounded-full bg-white/80 py-1.5 pl-2.5 pr-3 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 backdrop-blur lg:inline-flex dark:bg-slate-900/80 dark:text-slate-300 dark:ring-slate-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            {t('login.secureBadge')}
          </div>
        </div>

        {/* form — normal outer page scroll */}
        <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-14 sm:px-10 lg:px-12">
          <div className="w-full max-w-[560px] animate-slide-up py-2">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-8 shadow-2xl shadow-slate-900/[0.08] ring-1 ring-slate-900/5 backdrop-blur sm:p-12 lg:p-14 dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/50 dark:ring-white/5">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-lg shadow-red-600/30 ring-1 ring-red-500/20">
                  <Droplet className="h-7 w-7 text-white" fill="currentColor" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
                    {t('login.welcome')}
                  </p>
                  <h2 className="mt-1.5 text-[26px] font-bold tracking-tight text-slate-900 sm:text-[28px] dark:text-white">
                    {t('login.title')}
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {t('login.subtitle')}
                  </p>
                </div>
              </div>

              <div className="my-10 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" aria-hidden="true" />

              <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                <div className="space-y-2">
                  <label
                    htmlFor="staffId"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t('login.staffId')}
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="staffId"
                      value={staffId}
                      onChange={(e) => {
                        setStaffId(e.target.value);
                        if (staffError) setStaffError('');
                        if (error) setError('');
                      }}
                      placeholder={t('login.staffIdPh')}
                      autoComplete="username"
                      autoFocus
                      aria-invalid={Boolean(staffError)}
                      aria-describedby={staffError ? 'staffId-error' : undefined}
                      className="h-14 rounded-xl pl-11 text-[15px] shadow-sm focus:ring-4"
                      error={staffError || undefined}
                    />
                  </div>
                  {staffError ? (
                    <p id="staffId-error" role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {staffError}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="pin"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t('login.pin')}
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="pin"
                      type={showPin ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value);
                        if (pinError) setPinError('');
                        if (error) setError('');
                      }}
                      onKeyUp={handleCapsLock}
                      onKeyDown={handleCapsLock}
                      onBlur={() => setCapsLockOn(false)}
                      placeholder={t('login.pinPh')}
                      autoComplete="current-password"
                      aria-invalid={Boolean(pinError)}
                      aria-describedby={pinError ? 'pin-error' : capsLockOn ? 'pin-caps' : undefined}
                      className="h-14 rounded-xl pl-11 pr-12 text-[15px] shadow-sm focus:ring-4"
                      error={pinError || undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-red-500 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      aria-label={showPin ? t('login.hidePassword') : t('login.showPassword')}
                      aria-pressed={showPin}
                    >
                      {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {capsLockOn && !pinError ? (
                    <p id="pin-caps" className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <TriangleAlert className="h-3.5 w-3.5" />
                      {t('login.capsLock')}
                    </p>
                  ) : null}
                  {pinError ? (
                    <p id="pin-error" role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {pinError}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-[18px] w-[18px] rounded-md border-slate-300 text-red-600 shadow-sm focus:ring-red-500/30 dark:border-slate-600 dark:bg-slate-800"
                    />
                    {t('login.remember')}
                  </label>
                  <a
                    href="tel:104"
                    className="rounded-md text-sm font-semibold text-red-600 transition hover:text-red-700 hover:underline focus-visible:outline-2 focus-visible:outline-red-500 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {t('login.forgotPin')}
                  </a>
                </div>

                {error ? (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="flex items-start gap-2.5 rounded-xl bg-rose-50 px-4 py-3.5 text-sm font-medium leading-snug text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900/60"
                  >
                    <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={loading}
                  icon={loading ? undefined : <ArrowRight className="h-5 w-5" />}
                  className="h-[60px] rounded-xl text-base font-semibold shadow-lg shadow-red-600/25 transition-all hover:-translate-y-px hover:shadow-xl hover:shadow-red-600/25 active:translate-y-0"
                >
                  {loading ? t('login.signingIn') : t('login.submit')}
                </Button>
              </form>

              {/* TEMP-DEMO-LOGIN: frontend-only demo access — remove box + handler + i18n keys for production */}
              {DEMO_LOGIN_ENABLED ? (
                <div className="mt-6 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                    <FlaskConical className="h-4 w-4" />
                    {t('login.demoTitle')}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      disabled={loading}
                      onClick={() => handleDemoLogin('DistrictAdmin')}
                      className="border-amber-300 bg-white text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-900/40"
                    >
                      {t('login.demoDistrict')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      disabled={loading}
                      onClick={() => handleDemoLogin('SuperAdmin')}
                      className="border-amber-300 bg-white text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-900/40"
                    >
                      {t('login.demoSuper')}
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                    {t('login.demoOffline')}
                  </p>
                </div>
              ) : null}

              <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                {t('login.secure')}
              </div>
            </div>

            <p className="mt-6 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
              {t('login.helpCta')} <span className="mx-1 text-slate-300 dark:text-slate-700">•</span> Chennai, TN
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
