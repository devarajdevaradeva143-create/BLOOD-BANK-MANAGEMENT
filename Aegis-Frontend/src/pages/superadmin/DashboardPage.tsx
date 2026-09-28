import { useEffect, useMemo, useState } from 'react';
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
import { BLOOD_GROUPS } from '../../data/constants';
import {
  getDistrictStats,
  listDistrictsOverview,
  listDonors,
  listHospitals,
  listNotifications,
  listRequests,
  listUnitsSummary,
} from '../../lib/api';
import type { DistrictOverviewRow } from '../../lib/api';
import { StatCard } from '../../components/superadmin/StatCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';

const toneDot: Record<string, string> = {
  red: 'bg-red-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
};

interface ActivityRow {
  id: string;
  text: string;
  at: string;
  tone: 'red' | 'emerald' | 'amber' | 'sky';
}

function notificationTone(kind: string): ActivityRow['tone'] {
  const v = kind.toLowerCase();
  if (v.includes('emerg') || v.includes('crit') || v.includes('fail') || v.includes('error'))
    return 'red';
  if (v.includes('approv') || v.includes('success') || v.includes('complet') || v.includes('fulfil'))
    return 'emerald';
  if (v.includes('pend') || v.includes('warn') || v.includes('maint') || v.includes('expir') || v.includes('low'))
    return 'amber';
  return 'sky';
}

export default function DashboardPage() {
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalHospitals, setTotalHospitals] = useState(0);
  const [totalDonors, setTotalDonors] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [stockByGroup, setStockByGroup] = useState<Record<string, number>>({});
  const [districtRows, setDistrictRows] = useState<DistrictOverviewRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [
          hospitalsRes,
          hospitalsSample,
          donorsRes,
          requestsRes,
          pendingRes,
          recentRes,
          summaryRes,
          notificationsRes,
          districtsRes,
        ] = await Promise.allSettled([
          listHospitals({ page: 1, limit: 1 }),
          listHospitals({ page: 1, limit: 100 }),
          listDonors({ page: 1, limit: 1 }),
          listRequests({ page: 1, limit: 1 }),
          listRequests({ status: 'submitted', page: 1, limit: 1 }),
          listRequests({ page: 1, limit: 8 }),
          listUnitsSummary(),
          listNotifications({ page: 1, limit: 8 }),
          listDistrictsOverview(),
        ]);
        // Best-effort district stats (legacy shape) — supplements counts, never crashes.
        getDistrictStats().catch(() => undefined);
        if (cancelled) return;

        if (hospitalsRes.status === 'fulfilled') setTotalHospitals(hospitalsRes.value.total ?? 0);
        if (donorsRes.status === 'fulfilled') setTotalDonors(donorsRes.value.total ?? 0);
        if (requestsRes.status === 'fulfilled') setTotalRequests(requestsRes.value.total ?? 0);
        if (pendingRes.status === 'fulfilled') setPendingApprovals(pendingRes.value.total ?? 0);

        if (summaryRes.status === 'fulfilled') {
          const s = summaryRes.value as Record<string, unknown> & {
            total?: unknown;
            byGroup?: unknown;
            byBloodGroup?: unknown;
          };
          const byGroup =
            (s.byBloodGroup as Record<string, number> | undefined) ??
            (s.byGroup as Record<string, number> | undefined) ??
            {};
          const cleaned: Record<string, number> = {};
          for (const g of BLOOD_GROUPS) {
            const n = Number((byGroup as Record<string, unknown>)[g] ?? 0);
            cleaned[g] = Number.isFinite(n) ? n : 0;
          }
          setStockByGroup(cleaned);
          const total =
            typeof s.total === 'number' && Number.isFinite(s.total)
              ? s.total
              : Object.values(cleaned).reduce((a, b) => a + b, 0);
          setTotalUnits(total);
        } else {
          setStockByGroup({});
          setTotalUnits(0);
        }

        if (districtsRes.status === 'fulfilled' && districtsRes.value.length > 0) {
          setDistrictRows([...districtsRes.value].sort((a, b) => b.stock - a.stock).slice(0, 8));
        } else if (hospitalsSample.status === 'fulfilled') {
          const grouped = new Map<string, number>();
          for (const h of hospitalsSample.value.data ?? []) {
            const key = (h.district || '').trim() || '—';
            grouped.set(key, (grouped.get(key) ?? 0) + 1);
          }
          const fallbackRows: DistrictOverviewRow[] = [...grouped.entries()]
            .map(([district, hospitals]) => ({
              district,
              hospitals,
              banks: 0,
              donors: 0,
              requests: 0,
              stock: 0,
            }))
            .sort((a, b) => b.hospitals - a.hospitals)
            .slice(0, 8);
          setDistrictRows(fallbackRows);
        } else {
          setDistrictRows([]);
        }

        if (notificationsRes.status === 'fulfilled' && notificationsRes.value.data.length > 0) {
          setActivities(
            notificationsRes.value.data.slice(0, 8).map((n) => ({
              id: n.id,
              text: n.title || n.body,
              at: n.createdAt,
              tone: notificationTone(`${n.type} ${n.title}`),
            })),
          );
        } else if (recentRes.status === 'fulfilled' && recentRes.value.data.length > 0) {
          setActivities(
            recentRes.value.data.slice(0, 8).map((r) => ({
              id: r.requestId,
              text: `${r.requestId} · ${r.hospitalName || r.patientName} · ${r.bloodGroup} × ${r.units} (${r.status})`,
              at: r.createdAt ?? '',
              tone:
                r.status === 'submitted'
                  ? 'amber'
                  : r.status === 'cancelled'
                    ? 'red'
                    : 'emerald',
            })),
          );
        } else {
          setActivities([]);
        }

        const failures = [
          hospitalsRes,
          donorsRes,
          requestsRes,
          summaryRes,
        ].filter((r) => r.status === 'rejected');
        if (failures.length >= 4) {
          setError(t('common.error'));
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [refreshNonce, t]);

  const topDistricts = useMemo(() => districtRows.slice(0, 8), [districtRows]);
  const refetch = () => setRefreshNonce((n) => n + 1);

  return (
    <div>
      <PageHeader title={t('admin.dash.title')} subtitle={t('admin.dash.subtitle')} />

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
          <Spinner />
          <span className="text-sm">{t('common.loading')}</span>
        </div>
      ) : (
        <>
          {error ? (
            <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              icon={Building}
              label={t('admin.dash.totalHospitals')}
              value={totalHospitals}
              hint={t('admin.districts.hospitals')}
              chip="bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400"
            />
            <StatCard
              icon={Database}
              label={t('admin.dash.totalBanks')}
              value="—"
              hint={t('admin.districts.banks')}
              chip="bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400"
            />
            <StatCard
              icon={HeartHandshake}
              label={t('admin.dash.totalDonors')}
              value={totalDonors}
              hint={t('admin.districts.donors')}
              chip="bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
            />
            <StatCard
              icon={ClipboardList}
              label={t('admin.dash.totalRequests')}
              value={totalRequests}
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
            {BLOOD_GROUPS.every((g) => (stockByGroup[g] ?? 0) === 0) ? (
              <EmptyState title={t('admin.table.noResults')} hint={t('admin.table.noResultsHint')} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {BLOOD_GROUPS.map((group) => {
                  const available = stockByGroup[group] ?? 0;
                  const low = available < 150;
                  return (
                    <div
                      key={group}
                      className="rounded-xl bg-slate-50 px-4 py-3 text-center ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700"
                    >
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {group}
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                        {available}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {t('admin.inventory.available')}
                      </p>
                      {low ? (
                        <div className="mt-2 flex justify-center">
                          <Badge tone="red">{t('admin.inventory.lowStock')}</Badge>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                icon={<MapPin className="h-4.5 w-4.5" />}
                title={t('admin.dash.districtOverview')}
                subtitle={t('admin.districts.subtitle')}
              />
              {topDistricts.length === 0 ? (
                <EmptyState title={t('admin.table.noResults')} hint={t('admin.table.noResultsHint')} />
              ) : (
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
              )}
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
              {activities.length === 0 ? (
                <EmptyState
                  icon={<Activity className="h-7 w-7" />}
                  title={t('admin.dash.noActivities')}
                />
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activities.map((activity) => (
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
        </>
      )}
    </div>
  );
}
