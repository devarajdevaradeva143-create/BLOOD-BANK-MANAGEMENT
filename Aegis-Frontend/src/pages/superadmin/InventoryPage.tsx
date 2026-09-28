import { useEffect, useState } from 'react';
import { Droplets } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { listUnits, listUnitsSummary } from '../../lib/api';
import type { BloodGroup, BloodUnit } from '../../data/types';
import { BLOOD_GROUPS } from '../../data/constants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

interface GroupRow {
  group: BloodGroup;
  available: number;
  total: number;
  expiringSoon: number;
  low: boolean;
}

interface Totals {
  available: number;
  expiringSoon: number;
  total: number;
  lowGroups: number;
}

const LOW_STOCK_THRESHOLD = 150;
const SAMPLE_LIMIT = 100;
const MAX_SAMPLE_PAGES = 10;
const EXPIRING_WINDOW_DAYS = 30;

function qtyOf(unit: BloodUnit): number {
  const n = Number(unit.quantity);
  return Number.isFinite(n) ? n : 1;
}

interface ParsedSummary {
  availableByGroup: Record<string, number>;
  expiringSoon: number;
  total: number;
}

function parseSummary(raw: unknown): ParsedSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const availableByGroup: Record<string, number> = {};
  const byGroup = r.byBloodGroup ?? r.byGroup ?? r.stockByGroup;
  if (byGroup && typeof byGroup === 'object' && !Array.isArray(byGroup)) {
    for (const [k, v] of Object.entries(byGroup as Record<string, unknown>)) {
      availableByGroup[k] = num(v);
    }
  } else {
    const list = r.groups ?? r.data ?? r.breakdown;
    if (Array.isArray(list)) {
      for (const item of list) {
        if (!item || typeof item !== 'object') continue;
        const row = item as Record<string, unknown>;
        const g = String(row.group ?? row.bloodGroup ?? row._id ?? '');
        if (!g) continue;
        availableByGroup[g] = num(
          row.available ?? row.count ?? row.quantity ?? row.total ?? 0,
        );
      }
    }
  }
  return {
    availableByGroup,
    expiringSoon: num(r.expiringSoon ?? r.expiring),
    total: num(r.total ?? r.totalUnits),
  };
}

function isExpiringSoon(expiryDate: string, start: Date, end: Date): boolean {
  if (!expiryDate) return false;
  const d = new Date(expiryDate);
  if (Number.isNaN(d.getTime())) return false;
  return d >= start && d <= end;
}

export default function InventoryPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<GroupRow[]>([]);
  const [totals, setTotals] = useState<Totals>({ available: 0, expiringSoon: 0, total: 0, lowGroups: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRaw, sample] = await Promise.all([
          listUnitsSummary().catch((): null => null),
          (async () => {
            const first = await listUnits({ limit: SAMPLE_LIMIT, page: 1 });
            const units: BloodUnit[] = [...first.data];
            const totalUnits = first.total ?? first.data.length;
            const pages = Math.min(
              MAX_SAMPLE_PAGES,
              Math.max(1, Math.ceil(totalUnits / SAMPLE_LIMIT)),
            );
            for (let p = 2; p <= pages; p += 1) {
              const res = await listUnits({ limit: SAMPLE_LIMIT, page: p });
              units.push(...res.data);
              if (units.length >= totalUnits) break;
            }
            return { units, total: totalUnits };
          })().catch((): null => null),
        ]);
        if (cancelled) return;
        if (!summaryRaw && !sample) throw new Error(t('common.error'));
        const parsed = summaryRaw ? parseSummary(summaryRaw) : null;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start.getTime() + EXPIRING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const complete = !!sample && sample.units.length >= sample.total;
        const groupRows: GroupRow[] = BLOOD_GROUPS.map((g) => {
          const inGroup = sample ? sample.units.filter((u) => u.bloodGroup === g) : [];
          const available =
            parsed?.availableByGroup[g] ??
            inGroup.filter((u) => u.status === 'Available').reduce((s, u) => s + qtyOf(u), 0);
          const sampledTotal = inGroup.reduce((s, u) => s + qtyOf(u), 0);
          const total = complete ? sampledTotal : parsed ? available : sampledTotal;
          const expiringSoon = sample
            ? inGroup.filter((u) => isExpiringSoon(u.expiryDate, start, end)).length
            : 0;
          return { group: g, available, total, expiringSoon, low: available < LOW_STOCK_THRESHOLD };
        });
        const available = groupRows.reduce((s, r) => s + r.available, 0);
        const sampledExpiring = groupRows.reduce((s, r) => s + r.expiringSoon, 0);
        const summedTotal = groupRows.reduce((s, r) => s + r.total, 0);
        if (cancelled) return;
        setRows(groupRows);
        setTotals({
          available,
          expiringSoon: parsed ? parsed.expiringSoon : sampledExpiring,
          total: parsed && parsed.total > 0 ? parsed.total : summedTotal,
          lowGroups: groupRows.filter((r) => r.low).length,
        });
      } catch (e) {
        if (cancelled) return;
        setRows([]);
        setTotals({ available: 0, expiringSoon: 0, total: 0, lowGroups: 0 });
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

  const refetch = () => setRefreshNonce((n) => n + 1);

  const stats = [
    { label: t('admin.inventory.available'), value: totals.available },
    { label: t('admin.inventory.expiringSoon'), value: totals.expiringSoon },
    { label: t('admin.inventory.lowStock'), value: totals.lowGroups },
  ];

  return (
    <div>
      <PageHeader title={t('admin.inventory.title')} subtitle={t('admin.inventory.subtitle')} />

      <Card>
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              {t('admin.messages.retry')}
            </Button>
          </div>
        ) : totals.total === 0 ? (
          <EmptyState title={t('admin.table.noResults')} hint={t('admin.table.noResultsHint')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60"
              >
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stat.value.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {!loading && !error && totals.total > 0 ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((row) => (
              <Card
                key={row.group}
                className={
                  row.low ? 'border-rose-200 ring-1 ring-rose-300 dark:border-rose-900 dark:ring-rose-800' : ''
                }
              >
                <CardHeader
                  title={
                    <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {row.group}
                    </span>
                  }
                  action={
                    <Badge tone={row.low ? 'rose' : 'emerald'}>
                      {row.low ? t('admin.inventory.lowStock') : t('admin.inventory.healthy')}
                    </Badge>
                  }
                  icon={<Droplets className="h-4 w-4" />}
                />
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t('admin.inventory.available')}
                    </span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {row.available.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t('admin.dash.totalUnits')}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {row.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t('admin.inventory.expiringSoon')}
                    </span>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {row.expiringSoon.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('admin.table.showing', { count: totals.available, total: totals.total })}
            </p>
          </Card>
        </>
      ) : null}
    </div>
  );
}
