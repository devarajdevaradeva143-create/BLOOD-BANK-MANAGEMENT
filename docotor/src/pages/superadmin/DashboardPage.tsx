import { useMemo } from 'react';
import { Link } from 'react-router';
import {
  Activity,
  ArrowRight,
  Building,
  ClipboardList,
  Database,
  Droplet,
  HeartHandshake,
  MapPin,
  TimerReset,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { StatCard } from '../../components/superadmin/StatCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import {
  ACTIVITIES,
  BLOOD_BANKS,
  DISTRICTS_OVERVIEW,
  DONORS,
  HOSPITALS,
  INVENTORY,
  REQUESTS,
} from '../../data/superadminMock';

const toneDot: Record<string, string> = {
  red: 'bg-red-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
};

export default function DashboardPage() {
  const { t } = useI18n();

  const totalUnits = useMemo(() => INVENTORY.reduce((sum, row) => sum + row.available, 0), []);
  const pendingApprovals = useMemo(
    () => HOSPITALS.filter((h) => h.status === 'pending').length,
    [],
  );
  const topDistricts = useMemo(() => DISTRICTS_OVERVIEW.slice(0, 8), []);

  return (
    <div>
      <PageHeader title={t('admin.dash.title')} subtitle={t('admin.dash.subtitle')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={Building}
          label={t('admin.dash.totalHospitals')}
          value={HOSPITALS.length}
          hint={t('admin.districts.hospitals')}
          chip="bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400"
        />
        <StatCard
          icon={Database}
          label={t('admin.dash.totalBanks')}
          value={BLOOD_BANKS.length}
          hint={t('admin.districts.banks')}
          chip="bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400"
        />
        <StatCard
          icon={HeartHandshake}
          label={t('admin.dash.totalDonors')}
          value={DONORS.length}
          hint={t('admin.districts.donors')}
          chip="bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
        />
        <StatCard
          icon={ClipboardList}
          label={t('admin.dash.totalRequests')}
          value={REQUESTS.length}
          hint={t('admin.districts.requests')}
          chip="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
        />
        <StatCard
          icon={Droplet}
          label={t('admin.dash.totalUnits')}
          value={totalUnits}
          hint={t('admin.inventory.available')}
          chip="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
        />
        <StatCard
          icon={TimerReset}
          label={t('admin.dash.pendingApprovals')}
          value={pendingApprovals}
          hint={t('admin.districts.hospitals')}
          chip="bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400"
        />
      </div>

      <Card className="mt-5">
        <CardHeader
          icon={<Droplet className="h-4.5 w-4.5" />}
          title={t('admin.dash.stockByGroup')}
          subtitle={t('admin.inventory.available')}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INVENTORY.map((row) => (
            <div
              key={row.group}
              className="rounded-xl bg-slate-50 px-4 py-3 text-center ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700"
            >
              <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {row.group}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {row.available}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {t('admin.inventory.available')}
              </p>
              {row.low ? (
                <div className="mt-2 flex justify-center">
                  <Badge tone="red">{t('admin.inventory.lowStock')}</Badge>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            icon={<MapPin className="h-4.5 w-4.5" />}
            title={t('admin.dash.districtOverview')}
            subtitle={t('admin.districts.subtitle')}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4 font-semibold">District</th>
                  <th className="py-2 pr-4 font-semibold">{t('admin.districts.hospitals')}</th>
                  <th className="py-2 pr-4 font-semibold">{t('admin.districts.banks')}</th>
                  <th className="py-2 text-right font-semibold">{t('admin.districts.stock')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topDistricts.map((d) => (
                  <tr key={d.district} className="text-slate-700 dark:text-slate-200">
                    <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-white">
                      {d.district}
                    </td>
                    <td className="py-2.5 pr-4 font-mono">{d.hospitals}</td>
                    <td className="py-2.5 pr-4 font-mono">{d.banks}</td>
                    <td className="py-2.5 text-right font-mono font-semibold">{d.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={<Activity className="h-4.5 w-4.5" />}
            title={t('admin.dash.recentActivities')}
            action={
              <Link
                to="/superadmin/reports"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                {t('admin.dash.viewAll')}
              </Link>
            }
          />
          {ACTIVITIES.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-7 w-7" />}
              title={t('admin.dash.noActivities')}
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {ACTIVITIES.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${toneDot[activity.tone] ?? 'bg-slate-400'}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm leading-snug text-slate-700 dark:text-slate-200">
                      {activity.text}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      {activity.at}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          icon={<ArrowRight className="h-4.5 w-4.5" />}
          title={t('admin.dash.quickActions')}
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { to: '/superadmin/approvals', label: 'Hospital Approvals' },
            { to: '/superadmin/requests', label: 'Blood Requests' },
            { to: '/superadmin/reports', label: 'Reports' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-red-900 dark:hover:bg-red-950/40"
            >
              <span>{link.label}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                {t('admin.dash.viewAll')}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
