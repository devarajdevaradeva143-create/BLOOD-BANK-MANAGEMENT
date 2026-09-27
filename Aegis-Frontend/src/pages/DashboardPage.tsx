import { useMemo } from 'react';
import { Link } from 'react-router';
import { CircleCheck, CircleX, Droplets, FlaskConical, History, PlusCircle, TestTubes, TriangleAlert } from 'lucide-react';
import { useUnits } from '../context/UnitContext';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';
import type { BloodUnit, HistoryEvent } from '../data/types';
import { getEffectiveStatus, isExpiringSoon } from '../utils/expiry';
import { relativeTime } from '../utils/format';
import { Card, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';

interface HistoryEntry {
  unit: BloodUnit;
  event: HistoryEvent;
}

interface StatCard {
  key: string;
  label: TranslationKey;
  hint: TranslationKey;
  value: number;
  icon: typeof Droplets;
  chip: string;
}

export default function DashboardPage() {
  const { units, loading } = useUnits();
  const { t, locale } = useI18n();

  const stats = useMemo<StatCard[]>(() => {
    const available = units.filter((u) => getEffectiveStatus(u) === 'Available').length;
    const underTesting = units.filter((u) => getEffectiveStatus(u) === 'UnderTesting').length;
    const expiringSoon = units.filter((u) => isExpiringSoon(u)).length;
    const expired = units.filter((u) => getEffectiveStatus(u) === 'Expired').length;

    return [
      {
        key: 'total',
        label: 'dash.totalUnits',
        hint: 'dash.totalHint',
        value: units.length,
        icon: Droplets,
        chip: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
      },
      {
        key: 'available',
        label: 'dash.available',
        hint: 'dash.availableHint',
        value: available,
        icon: CircleCheck,
        chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      },
      {
        key: 'testing',
        label: 'dash.underTesting',
        hint: 'dash.testingHint',
        value: underTesting,
        icon: FlaskConical,
        chip: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      },
      {
        key: 'expiring',
        label: 'dash.expiringSoon',
        hint: 'dash.expiringHint',
        value: expiringSoon,
        icon: TriangleAlert,
        chip: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
      },
      {
        key: 'expired',
        label: 'dash.expired',
        hint: 'dash.expiredHint',
        value: expired,
        icon: CircleX,
        chip: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
      },
    ];
  }, [units]);

  const recentEntries = useMemo<HistoryEntry[]>(() => {
    const entries: HistoryEntry[] = [];
    for (const unit of units) {
      for (const event of unit.history) {
        entries.push({ unit, event });
      }
    }
    entries.sort((a, b) => new Date(b.event.at).getTime() - new Date(a.event.at).getTime());
    return entries.slice(0, 8);
  }, [units]);

  return (
    <div>
      <PageHeader title={t('dash.title')} subtitle={t('dash.subtitle')} />

      {loading && units.length === 0 ? (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
          <Spinner />
          <span className="text-sm">{t('common.loading')}</span>
        </div>
      ) : (
      <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => {
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
              <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{t(stat.label)}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t(stat.hint)}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t('dash.quickActions')}
        </p>
        <Link
          to="/units/new"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        >
          <PlusCircle className="h-4 w-4" />
          {t('dash.addUnit')}
        </Link>
        <Link
          to="/testing"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-950"
        >
          <TestTubes className="h-4 w-4" />
          {t('dash.runTesting')}
        </Link>
      </div>

      <Card className="mt-5">
        <CardHeader
          icon={<History className="h-4.5 w-4.5" />}
          title={t('dash.recentUpdates')}
          subtitle={t('dash.recentHint')}
          action={
            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              {t('dash.viewAll')}
            </Link>
          }
        />
        {recentEntries.length === 0 ? (
          <EmptyState icon={<History className="h-7 w-7" />} title={t('dash.noUpdates')} hint={t('dash.recentHint')} />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentEntries.map(({ unit, event }) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 first:pt-0 last:pb-0"
              >
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{unit.id}</span>
                <StatusBadge status={getEffectiveStatus(unit)} />
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {t(`history.event.${event.type}` as TranslationKey)}
                </span>
                {event.status ? <StatusBadge status={event.status} /> : null}
                {event.note ? (
                  <span className="truncate text-xs text-slate-500 dark:text-slate-400">{event.note}</span>
                ) : null}
                <span className="ml-auto shrink-0 text-xs text-slate-400 dark:text-slate-500">
                  {relativeTime(event.at, locale)}
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
