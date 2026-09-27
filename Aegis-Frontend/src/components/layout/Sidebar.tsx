import { useState } from 'react';
import type { MouseEventHandler } from 'react';
import { NavLink, useNavigate } from 'react-router';
import {
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Droplet,
  Eye,
  FileWarning,
  HeartHandshake,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Stethoscope,
  TestTubes,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../context/AuthContext';
import type { TranslationKey } from '../../i18n/translations';

interface NavItem {
  to?: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  disabled?: boolean;
  action?: 'logout';
}

interface NavGroup {
  labelKey: TranslationKey;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: 'nav.main',
    items: [
      { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
      { labelKey: 'nav.overview', icon: Eye, disabled: true },
    ],
  },
  {
    labelKey: 'nav.healthRecords',
    items: [
      { to: '/units', labelKey: 'nav.bloodUnits', icon: Droplet },
      { to: '/testing', labelKey: 'nav.testing', icon: TestTubes },
      { to: '/history', labelKey: 'nav.history', icon: History },
      { to: '/expiry', labelKey: 'nav.expiry', icon: CalendarClock },
    ],
  },
  {
    labelKey: 'nav.management',
    items: [
      { labelKey: 'nav.doctors', icon: Stethoscope, disabled: true },
      { labelKey: 'nav.staff', icon: Users, disabled: true },
      { labelKey: 'nav.donors', icon: HeartHandshake, disabled: true },
      { labelKey: 'nav.hospitals', icon: Building2, disabled: true },
      { labelKey: 'nav.districtRecords', icon: Map, disabled: true },
    ],
  },
  {
    labelKey: 'nav.reports',
    items: [
      { labelKey: 'nav.bloodStockReports', icon: BarChart3, disabled: true },
      { labelKey: 'nav.testingReports', icon: ClipboardCheck, disabled: true },
      { labelKey: 'nav.expiryReports', icon: FileWarning, disabled: true },
    ],
  },
  {
    labelKey: 'nav.system',
    items: [
      { labelKey: 'nav.notifications', icon: Bell, disabled: true },
      { to: '/settings', labelKey: 'nav.settings', icon: Settings },
      { labelKey: 'nav.logout', icon: LogOut, action: 'logout' },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface TipState {
  label: string;
  x: number;
  y: number;
}

export function Sidebar({ mobileOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tip, setTip] = useState<TipState | null>(null);

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login', { replace: true });
  };

  const isCollapsed = collapsed && !mobileOpen;

  const showTip =
    (label: string): MouseEventHandler<HTMLElement> =>
    (e) => {
      if (!isCollapsed) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setTip({ label, x: rect.right + 10, y: rect.top + rect.height / 2 });
    };

  const hideTip = () => setTip(null);

  const renderItem = (item: NavItem) => {
    const label = t(item.labelKey);
    const Icon = item.icon;

    if (item.action === 'logout') {
      return (
        <button
          key={label}
          type="button"
          onClick={handleLogout}
          onMouseEnter={showTip(label)}
          onMouseLeave={hideTip}
          className={`flex w-full items-center rounded-lg text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 ${
            isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed ? label : null}
        </button>
      );
    }

    if (item.disabled || !item.to) {
      const tipLabel = `${label} — ${t('nav.comingSoon')}`;
      return (
        <div
          key={label}
          role="link"
          aria-disabled="true"
          onMouseEnter={showTip(tipLabel)}
          onMouseLeave={hideTip}
          className={`flex cursor-not-allowed items-center rounded-lg text-sm font-medium text-slate-400 transition-colors hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-slate-800/50 ${
            isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed ? (
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span className="truncate">{label}</span>
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                {t('nav.comingSoon')}
              </span>
            </span>
          ) : null}
        </div>
      );
    }

    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/units'}
        onClick={onClose}
        onMouseEnter={showTip(label)}
        onMouseLeave={hideTip}
        className={({ isActive }) =>
          `flex items-center rounded-lg text-sm font-medium transition-colors ${
            isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
          } ${
            isActive
              ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
          }`
        }
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        {!isCollapsed ? label : null}
      </NavLink>
    );
  };

  const content = (
    <div className="flex h-full flex-col">
      <div
        className={`flex h-16 shrink-0 items-center border-b border-slate-200 dark:border-slate-800 ${
          isCollapsed ? 'justify-center px-2' : 'gap-3 px-5'
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 shadow-sm shadow-red-600/40">
          <Droplet className="h-5 w-5 text-white" fill="currentColor" />
        </div>
        {!isCollapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {t('app.name')}
            </p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {t('app.tagline')}
            </p>
          </div>
        ) : null}
        {!isCollapsed ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {!isCollapsed ? (
        <div className="hidden shrink-0 border-b border-slate-200 px-3 py-2 lg:block dark:border-slate-800">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={t('nav.collapse')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <PanelLeftClose className="h-[18px] w-[18px] shrink-0" />
            {t('nav.collapse')}
          </button>
        </div>
      ) : (
        <div className="hidden shrink-0 border-b border-slate-200 px-2 py-2 lg:block dark:border-slate-800">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={t('nav.expand')}
            onMouseEnter={showTip(t('nav.expand'))}
            onMouseLeave={hideTip}
            className="flex w-full items-center justify-center rounded-lg py-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}

      <nav
        className={`scrollbar-thin flex-1 space-y-5 overflow-y-auto py-4 ${
          isCollapsed ? 'px-2' : 'px-3'
        }`}
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey}>
            {!isCollapsed ? (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t(group.labelKey)}
              </p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-slate-200 dark:bg-slate-800" />
            )}
            <div className="space-y-1">{group.items.map(renderItem)}</div>
          </div>
        ))}
      </nav>

      <div
        className={`shrink-0 border-t border-slate-200 dark:border-slate-800 ${
          isCollapsed ? 'p-2' : 'p-3'
        }`}
      >
        {user ? (
          <div
            className={`flex items-center rounded-lg bg-slate-50 dark:bg-slate-800/60 ${
              isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
              {user.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
            </div>
            {!isCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {user.name}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {user.id} ·{' '}
                  {t(user.role === 'Doctor' ? 'login.demoDoctor' : 'login.demoStaff')}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-[width] duration-200 lg:block dark:border-slate-800 dark:bg-slate-900 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-xl animate-slide-in-right dark:border-slate-800 dark:bg-slate-900">
            {content}
          </aside>
        </div>
      ) : null}

      {tip ? (
        <span
          role="tooltip"
          className="pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-slate-700"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.label}
        </span>
      ) : null}
    </>
  );
}
