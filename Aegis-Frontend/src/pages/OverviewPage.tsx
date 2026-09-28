import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Activity,
  Building2,
  CircleCheck,
  ClipboardList,
  Droplets,
  HeartHandshake,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { BLOOD_GROUPS, DISTRICTS } from '../data/constants';
import { getDistrictStats } from '../lib/api';
import type { DistrictStats } from '../lib/api';
import { relativeTime } from '../utils/format';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';

const ZERO_STATS: DistrictStats = {
  totalUnits: 0,
  availableUnits: 0,
  totalRequests: 0,
  totalDonations: 0,
  totalHospitals: 0,
  stockByGroup: {},
  recentActivity: [],
};

interface StatDef {
  key: string;
  label: string;
  hint: string;
  value: number;
  icon: typeof Droplets;
  chip: string;
}

export default function OverviewPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();

  const [stats, setStats] = useState<DistrictStats>(ZERO_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const userDistrictSlug = useMemo(() => (user?.districtId ?? '').trim().toLowerCase(), [user]);

  const userDistrictDisplay = useMemo(() => {
    if (!userDistrictSlug) return '';
    const found = DISTRICTS.find((d) => d.toLowerCase() === userDistrictSlug);
    return found ?? user?.districtId ?? '';
  }, [user, userDistrictSlug]);

  const scopeDisplay = userDistrictDisplay || user?.districtId || '—';
  const districtMissing = user?.role === 'DistrictAdmin' && !userDistrictSlug;

  useEffect(() => {
    let cancelled = false;
    async function run() {
      // Fail-closed: no district scope means no district data.
      if (districtMissing) {
        setStats(ZERO_STATS);
        setError(t('donations.forbidden'));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // District scope is resolved server-side from the auth session.
        const res = await getDistrictStats();
        if (cancelled) return;
        setStats(res);
      } catch (e) {
        if (cancelled) return;
        // Graceful fallback: zero stats, activity section shows EmptyState.
        setStats(ZERO_STATS);
        setError(e instanceof Error ? e.message : t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [districtMissing, refreshNonce, t]);

  // Auto-refresh like DonorsPage: 60s polling + tab focus.
  useEffect(() => {
    const id = window.setInterval(() => setRefreshNonce((n) => n + 1), 60000);
    const onFocus = () => setRefreshNonce((n) => n + 1);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const cards = useMemo<StatDef[]>(
    () => [
      {
        key: 'total',
        label: t('dash.totalUnits'),
        hint: t('dash.totalHint'),
        value: stats.totalUnits,
        icon: Droplets,
        chip: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
      },
      {
        key: 'available',
        label: t('dash.available'),
        hint: t('dash.availableHint'),
        value: stats.availableUnits,
        icon: CircleCheck,
        chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      },
      {
        key: 'requests',
        label: 'Blood Requests',
        hint: 'Requests in your district',
        value: stats.totalRequests,
        icon: ClipboardList,
        chip: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
      },
      {
        key: 'donations',
        label: 'Donations',
        hint: 'Donations in your district',
        value: stats.totalDonations,
        icon: HeartHandshake,
        chip: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
      },
      {
        key: 'hospitals',
        label: 'Hospitals',
        hint: 'Hospitals in your district',
        value: stats.totalHospitals,
        icon: Building2,
        chip: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      },
    ],
    [stats, t],
  );

  const recent = useMemo(() => stats.recentActivity.slice(0, 8), [stats]);

  const refetch = () => setRefreshNonce((n) => n + 1);

  return (
    <div>
      <PageHeader title={t('dash.title')} subtitle={t('dash.subtitle')} />

      <Card className="border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40">
        <p className="text-xs font-medium text-sky-800 dark:text-sky-200">
          Showing overview for {scopeDisplay}
        </p>
      </Card>

      {loading && stats.totalUnits === 0 && stats.totalRequests === 0 && !error ? (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
          <Spinner />
          <span className="text-sm">{t('common.loading')}</span>
        </div>
      ) : (
        <>
          {error ? (
            <Card className="mt-4 border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p role="alert" className="text-sm font-medium text-rose-700 dark:text-rose-300">
                  {error}
                </p>
                <Button variant="outline" size="sm" onClick={refetch}>
                  Retry
                </Button>
              </div>
            </Card>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.key}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.chip}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{stat.hint}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('dash.quickActions')}
            </p>
            <Link
              to="/hospitals"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
            >
              <Building2 className="h-4 w-4" />
              View hospitals
            </Link>
            <Link
              to="/requests"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-950"
            >
              <ClipboardList className="h-4 w-4" />
              View requests
            </Link>
          </div>

          <Card className="mt-5">
            <CardHeader
              icon={<Activity className="h-4.5 w-4.5" />}
              title={t('admin.dash.stockByGroup')}
              subtitle={`Blood stock by group · ${scopeDisplay}`}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {BLOOD_GROUPS.map((group) => (
                <div
                  key={group}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <p className="text-base font-bold text-red-600 dark:text-red-400">{group}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                    {stats.stockByGroup[group] ?? 0}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {t('units.quantity')}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="mt-5">
            <CardHeader
              icon={<History className="h-4.5 w-4.5" />}
              title={t('dash.recentUpdates')}
              subtitle={t('dash.recentHint')}
            />
            {recent.length === 0 ? (
              <EmptyState
                icon={<History className="h-7 w-7" />}
                title={t('dash.noUpdates')}
                hint={t('dash.recentHint')}
              />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recent.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {item.title}
                    </span>
                    {item.detail ? (
                      <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {item.detail}
                      </span>
                    ) : null}
                    <span className="ml-auto shrink-0 text-xs text-slate-400 dark:text-slate-500">
                      {relativeTime(item.at, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
