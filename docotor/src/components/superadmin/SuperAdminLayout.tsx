import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Droplet, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { useI18n } from '../../i18n/I18nContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import type { TranslationKey } from '../../i18n/translations';

const COLLAPSE_KEY = 'superadmin-sidebar-collapsed';

const TITLE_KEYS: Record<string, TranslationKey> = {
  '/superadmin/dashboard': 'admin.dash.title',
  '/superadmin/approvals': 'admin.approvals.title',
  '/superadmin/admins': 'admin.admins.title',
  '/superadmin/hospitals': 'admin.hospitals.title',
  '/superadmin/banks': 'admin.banks.title',
  '/superadmin/donors': 'admin.donors.title',
  '/superadmin/requests': 'admin.requests.title',
  '/superadmin/inventory': 'admin.inventory.title',
  '/superadmin/districts': 'admin.districts.title',
  '/superadmin/reports': 'admin.reports.title',
  '/superadmin/profile': 'admin.profile.title',
  '/superadmin/settings': 'admin.settings.title',
};

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

export function SuperAdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const { t, locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const title = t(TITLE_KEYS[location.pathname] ?? 'admin.dash.title');

  const handleLogout = () => {
    logout();
    navigate('/superadmin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SuperAdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            to="/superadmin/dashboard"
            className="flex items-center gap-2 lg:hidden"
            aria-label={t('app.name')}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
              <Droplet className="h-4 w-4 text-white" fill="currentColor" />
            </div>
          </Link>

          <div className="hidden min-w-0 lg:block">
            <h2 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </h2>
            <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
              {t('app.sub')}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  locale === 'en'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                aria-pressed={locale === 'en'}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale('ta')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  locale === 'ta'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                aria-pressed={locale === 'ta'}
              >
                TA
              </button>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:h-9 sm:w-9 sm:p-0 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label={theme === 'dark' ? t('settings.light') : t('settings.dark')}
              title={theme === 'dark' ? t('settings.light') : t('settings.dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3 dark:border-slate-700">
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{user.id}</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                  {user.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                  aria-label={t('nav.logout')}
                  title={t('nav.logout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
