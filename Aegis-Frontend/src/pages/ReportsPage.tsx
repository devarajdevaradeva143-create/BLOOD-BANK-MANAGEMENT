import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CalendarClock, Clock, Download, Droplet, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnits } from '../context/UnitContext';
import { BLOOD_GROUPS, DISTRICTS } from '../data/constants';
import type { BloodGroup, BloodUnit } from '../data/types';
import {
  daysRemaining,
  getEffectiveStatus,
  getExpiryStatus,
  parseDate,
  startOfDay,
} from '../utils/expiry';
import { formatDate, todayISO } from '../utils/format';
import { listUnitsSummary } from '../lib/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { ExpiryBadge, StatusBadge, TestStatusBadge } from '../components/ui/StatusBadge';

type ReportTab = 'stock' | 'testing' | 'expiry';
type Period = 'all' | '7d' | '30d';

const TABS: { key: ReportTab; label: string }[] = [
  { key: 'stock', label: 'Stock' },
  { key: 'testing', label: 'Testing' },
  { key: 'expiry', label: 'Expiry' },
];

const PERIODS: { key: Period; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
];

const MS_PER_DAY = 86_400_000;

function collectedWithin(collectionDate: string, period: Period): boolean {
  if (period === 'all') return true;
  const windowDays = period === '7d' ? 7 : 30;
  const collected = startOfDay(parseDate(collectionDate));
  if (Number.isNaN(collected.getTime())) return false;
  const today = startOfDay(new Date());
  const diff = Math.round((today.getTime() - collected.getTime()) / MS_PER_DAY);
  return diff >= 0 && diff <= windowDays;
}

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

const rowTone: Record<'expired' | 'soon' | 'safe', string> = {
  expired: 'border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/30',
  soon: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/30',
  safe: 'border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20',
};

function ExpiryReportRow({ unit, variant }: { unit: BloodUnit; variant: 'expired' | 'soon' | 'safe' }) {
  const days = daysRemaining(unit.expiryDate);
  return (
    <li
      className={`rounded-xl border border-slate-200 border-l-4 p-4 shadow-sm dark:border-slate-800 dark:shadow-none ${rowTone[variant]}`}
    >
      <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
              {unit.id}
            </span>
            <Badge tone="red">{unit.bloodGroup}</Badge>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {unit.district} · {unit.storageLocation} · Expires {formatDate(unit.expiryDate, 'en')}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={getEffectiveStatus(unit)} />
            <ExpiryBadge status={getExpiryStatus(unit)} />
            <TestStatusBadge status={unit.testStatus} />
          </div>
        </div>
        <div className="ml-auto shrink-0 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Days remaining
          </p>
          <p
            className={`text-3xl font-semibold leading-tight tracking-tight ${
              days < 0
                ? 'text-rose-600 dark:text-rose-400'
                : days <= 30
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-900 dark:text-white'
            }`}
          >
            {days < 0 ? Math.abs(days) : days}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {days < 0 ? `Overdue by ${Math.abs(days)} days` : days === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>
    </li>
  );
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const { units, loading, error } = useUnits();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bloodGroup, setBloodGroup] = useState('');
  const [period, setPeriod] = useState<Period>('all');

  const rawTab = searchParams.get('tab');
  const tab: ReportTab = rawTab === 'testing' || rawTab === 'expiry' ? rawTab : 'stock';

  const setTab = (next: ReportTab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', next);
    setSearchParams(nextParams);
  };

  // Optional server summary — best effort only. The page works fully
  // client-side from useUnits() when the API is unreachable.
  useEffect(() => {
    listUnitsSummary().catch(() => {
      /* ignore — client-side aggregation from useUnits() is authoritative */
    });
  }, []);

  const userDistrictSlug = useMemo(() => (user?.districtId ?? '').trim().toLowerCase(), [user]);

  const districtDisplay = useMemo(() => {
    if (!userDistrictSlug) return '—';
    return DISTRICTS.find((d) => d.toLowerCase() === userDistrictSlug) ?? user?.districtId ?? '—';
  }, [user, userDistrictSlug]);

  const districtMissing = !authLoading && !userDistrictSlug;

  const scopedUnits = useMemo(() => {
    if (!userDistrictSlug) return [];
    return units.filter((u) => (u.district ?? '').trim().toLowerCase() === userDistrictSlug);
  }, [units, userDistrictSlug]);

  const periodScoped = useMemo(
    () => scopedUnits.filter((u) => collectedWithin(u.collectionDate, period)),
    [scopedUnits, period],
  );

  const filtered = useMemo(
    () => (bloodGroup ? periodScoped.filter((u) => u.bloodGroup === bloodGroup) : periodScoped),
    [periodScoped, bloodGroup],
  );

  const stockRows = useMemo(() => {
    const groups: BloodGroup[] = bloodGroup ? [bloodGroup as BloodGroup] : [...BLOOD_GROUPS];
    return groups.map((group) => {
      const inGroup = periodScoped.filter((u) => u.bloodGroup === group);
      const available = inGroup.filter((u) => getEffectiveStatus(u) === 'Available').length;
      const reserved = inGroup.filter((u) => getEffectiveStatus(u) === 'Reserved').length;
      return { group, available, reserved, total: inGroup.length };
    });
  }, [periodScoped, bloodGroup]);

  const stockTotals = useMemo(
    () =>
      stockRows.reduce(
        (acc, row) => ({
          available: acc.available + row.available,
          reserved: acc.reserved + row.reserved,
          total: acc.total + row.total,
        }),
        { available: 0, reserved: 0, total: 0 },
      ),
    [stockRows],
  );

  const testingStats = useMemo(() => {
    const pending = filtered.filter((u) => u.testStatus === 'Pending').length;
    const passed = filtered.filter((u) => u.testStatus === 'Passed').length;
    const failed = filtered.filter((u) => u.testStatus === 'Failed').length;
    const total = filtered.length;
    const passRate = total === 0 ? 0 : Math.round((passed / total) * 100);
    const failedUnits = filtered.filter((u) => u.testStatus === 'Failed');
    return { pending, passed, failed, total, passRate, failedUnits };
  }, [filtered]);

  const expiryBuckets = useMemo(() => {
    const expired: BloodUnit[] = [];
    const soon: BloodUnit[] = [];
    const safe: BloodUnit[] = [];
    for (const unit of filtered) {
      const days = daysRemaining(unit.expiryDate);
      const terminal = unit.status === 'Used' || unit.status === 'Discarded';
      if (getEffectiveStatus(unit) === 'Expired' || days < 0) {
        expired.push(unit);
      } else if (!terminal && days <= 30) {
        soon.push(unit);
      } else if (!terminal) {
        safe.push(unit);
      }
    }
    const byExpiry = (a: BloodUnit, b: BloodUnit) => a.expiryDate.localeCompare(b.expiryDate);
    expired.sort(byExpiry);
    soon.sort(byExpiry);
    safe.sort(byExpiry);
    return { expired, soon, safe };
  }, [filtered]);

  const downloadCsv = () => {
    const header = 'Blood Group,Available,Reserved,Total';
    const lines = stockRows.map((row) => `${row.group},${row.available},${row.reserved},${row.total}`);
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-report-${userDistrictSlug || 'district'}-${todayISO()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  if (districtMissing) {
    return (
      <div>
        <PageHeader title="Reports" subtitle="District-level stock, testing and expiry reports" />
        <Card className="border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40">
          <p className="text-xs font-medium text-sky-800 dark:text-sky-200">
            Showing reports for district: {districtDisplay}
          </p>
        </Card>
        <Card className="mt-4">
          <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-300">
            No district assigned to your account, so reports cannot be shown.
          </p>
          <div className="mt-2">
            <EmptyState
              title="No district assigned"
              hint="Your account is not linked to a district. Contact your administrator."
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="District-level stock, testing and expiry reports"
        action={
          tab === 'stock' ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Download className="h-3.5 w-3.5" />}
                onClick={downloadCsv}
              >
                Download CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Printer className="h-3.5 w-3.5" />}
                onClick={handlePrint}
              >
                Print
              </Button>
            </div>
          ) : undefined
        }
      />

      <Card className="border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40">
        <p className="text-xs font-medium text-sky-800 dark:text-sky-200">
          Showing reports for district: {districtDisplay} · {filtered.length} of {scopedUnits.length}{' '}
          units in scope
        </p>
      </Card>

      <div className="mt-4 inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              aria-pressed={active}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <Card className="mt-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[150px] flex-1 sm:max-w-[220px] sm:flex-none">
            <label
              htmlFor="reports-group"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Blood group
            </label>
            <Select
              id="reports-group"
              className="mt-1.5"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
            >
              <option value="">All groups</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {PERIODS.map((p) => {
              const active = period === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  aria-pressed={active}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <p className="w-full text-[11px] text-slate-500 dark:text-slate-400">
            Period filters by collection date.
          </p>
        </div>
      </Card>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"
        >
          {error}
        </p>
      ) : null}

      {loading && units.length === 0 ? (
        <Card className="mt-4">
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">Loading reports…</span>
          </div>
        </Card>
      ) : tab === 'stock' ? (
        <Card padded={false} className="mt-4 overflow-hidden">
          {stockRows.length === 0 || stockTotals.total === 0 ? (
            <EmptyState title="No stock to report" hint="No units match the current filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>Blood group</th>
                    <th className={`${th} text-right`}>Available</th>
                    <th className={`${th} text-right`}>Reserved</th>
                    <th className={`${th} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {stockRows.map((row) => (
                    <tr
                      key={row.group}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone="red">{row.group}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {row.available}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-semibold text-sky-600 dark:text-sky-400">
                        {row.reserved}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-semibold text-slate-900 dark:text-white">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Total
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {stockTotals.available}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {stockTotals.reserved}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {stockTotals.total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      ) : tab === 'testing' ? (
        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader title="Testing summary" subtitle={`${testingStats.total} units in scope`} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Pending
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                  {testingStats.pending}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Passed
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                  {testingStats.passed}
                </p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900/60 dark:bg-rose-950/30">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                  Failed
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                  {testingStats.failed}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Pass rate</p>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {testingStats.passRate}% ({testingStats.passed} of {testingStats.total})
                </p>
              </div>
              <div
                className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                role="progressbar"
                aria-valuenow={testingStats.passRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Pass rate"
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${testingStats.passRate}%` }}
                />
              </div>
            </div>
          </Card>

          <Card padded={false} className="overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Failed units</h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {testingStats.failedUnits.length} failed units in scope
              </p>
            </div>
            {testingStats.failedUnits.length === 0 ? (
              <EmptyState title="No failed units" hint="No failed units match the current filters." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                      <th className={th}>Unit ID</th>
                      <th className={th}>Group</th>
                      <th className={th}>Collected</th>
                      <th className={th}>Tested</th>
                      <th className={th}>Test status</th>
                      <th className={th}>Unit status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                    {testingStats.failedUnits.map((unit) => (
                      <tr
                        key={unit.id}
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-semibold text-slate-900 dark:text-white">
                          {unit.id}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Badge tone="red">{unit.bloodGroup}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                          {formatDate(unit.collectionDate, 'en')}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                          {unit.testDate ? formatDate(unit.testDate, 'en') : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <TestStatusBadge status={unit.testStatus} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={getEffectiveStatus(unit)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          <Card>
            <CardHeader
              icon={<CalendarClock className="h-4.5 w-4.5" />}
              title="Expired"
              action={<Badge tone="rose">{expiryBuckets.expired.length} units</Badge>}
            />
            {expiryBuckets.expired.length === 0 ? (
              <EmptyState title="No expired units" hint="No expired units match the current filters." />
            ) : (
              <ul className="space-y-3">
                {expiryBuckets.expired.map((unit) => (
                  <ExpiryReportRow key={unit.id} unit={unit} variant="expired" />
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader
              icon={<Clock className="h-4.5 w-4.5" />}
              title="Expiring soon (within 30 days)"
              action={<Badge tone="rose">{expiryBuckets.soon.length} units</Badge>}
            />
            {expiryBuckets.soon.length === 0 ? (
              <EmptyState
                title="Nothing expiring soon"
                hint="No units expiring within 30 days match the current filters."
              />
            ) : (
              <ul className="space-y-3">
                {expiryBuckets.soon.map((unit) => (
                  <ExpiryReportRow key={unit.id} unit={unit} variant="soon" />
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader
              icon={<Droplet className="h-4.5 w-4.5" />}
              title="Safe (more than 30 days)"
              action={<Badge tone="rose">{expiryBuckets.safe.length} units</Badge>}
            />
            {expiryBuckets.safe.length === 0 ? (
              <EmptyState title="No safe units" hint="No safe units match the current filters." />
            ) : (
              <ul className="space-y-3">
                {expiryBuckets.safe.map((unit) => (
                  <ExpiryReportRow key={unit.id} unit={unit} variant="safe" />
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
