import { useCallback, useEffect, useState } from 'react';
import { Building2, Download, FileText, RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/I18nContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import {
  getReports,
  listDonors,
  listHospitals,
  listRequests,
  listUnitsSummary,
} from '../../lib/api';
import type { ReportPeriod, SuperAdminReports, UnitsSummary } from '../../lib/api';

type Period = ReportPeriod;

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function escapeCsv(value: unknown): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadBlob(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [reports, setReports] = useState<SuperAdminReports | null>(null);
  const [summary, setSummary] = useState<UnitsSummary | null>(null);
  const [requestRows, setRequestRows] = useState<any[]>([]);
  const [requestTotal, setRequestTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [donorRows, setDonorRows] = useState<any[]>([]);
  const [donorTotal, setDonorTotal] = useState(0);
  const [hospitalRows, setHospitalRows] = useState<any[]>([]);
  const [hospitalTotal, setHospitalTotal] = useState(0);

  const periods: { key: Period; label: string }[] = [
    { key: 'daily', label: t('admin.reports.daily') },
    { key: 'weekly', label: t('admin.reports.weekly') },
    { key: 'monthly', label: t('admin.reports.monthly') },
  ];

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [rep, summ, reqAll, reqPending, reqApproved, donors, hospitals] = await Promise.all([
          getReports(period),
          listUnitsSummary().catch((): UnitsSummary => ({})),
          listRequests({ page: 1, limit: 100 }).catch(() => ({ data: [], total: 0 })),
          listRequests({ status: 'submitted', page: 1, limit: 1 }).catch(() => ({ total: 0 })),
          listRequests({ status: 'approved', page: 1, limit: 1 }).catch(() => ({ total: 0 })),
          listDonors({ page: 1, limit: 100 }).catch(() => ({ data: [], total: 0 })),
          listHospitals({ page: 1, limit: 100 }).catch(() => ({ data: [], total: 0 })),
        ]);
        if (cancelled) return;
        setReports(rep ?? {});
        setSummary(summ ?? {});
        const allRows = (reqAll as { data?: any[] }).data ?? [];
        setRequestRows(allRows);
        setRequestTotal(toNumber((reqAll as { total?: unknown }).total, allRows.length));
        setPendingCount(toNumber((reqPending as { total?: unknown }).total, 0));
        setApprovedCount(toNumber((reqApproved as { total?: unknown }).total, 0));
        const dRows = (donors as { data?: any[] }).data ?? [];
        setDonorRows(dRows);
        setDonorTotal(toNumber((donors as { total?: unknown }).total, dRows.length));
        const hRows = (hospitals as { data?: any[] }).data ?? [];
        setHospitalRows(hRows);
        setHospitalTotal(toNumber((hospitals as { total?: unknown }).total, hRows.length));
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
  }, [period, refreshNonce, t]);

  const refetch = () => setRefreshNonce((n) => n + 1);

  const stockByGroup: Record<string, number> = (() => {
    const fromSummary = summary?.byGroup;
    if (fromSummary && typeof fromSummary === 'object') {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(fromSummary)) out[k] = toNumber(v);
      if (Object.keys(out).length > 0) return out;
    }
    const fromReports = reports?.stockByGroup;
    if (fromReports && typeof fromReports === 'object') {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(fromReports as Record<string, unknown>))
        out[k] = toNumber(v);
      if (Object.keys(out).length > 0) return out;
    }
    return {};
  })();

  const stockGroups = Object.keys(stockByGroup).sort();
  const stockTotal = stockGroups.reduce((s, g) => s + toNumber(stockByGroup[g]), 0);

  const stock = {
    total:
      toNumber(reports?.totalUnits, 0) ||
      toNumber(summary?.total, 0) ||
      stockTotal,
    collections: toNumber(reports?.collections, 0),
    issues: toNumber(reports?.issues, 0),
  };

  const donorStatusOf = (d: any): string =>
    String(d?.status ?? d?.eligibility ?? 'eligible').toLowerCase();
  const activeDonors = donorRows.filter((d) => donorStatusOf(d) === 'eligible').length;
  const donors = {
    total: donorTotal || toNumber(reports?.totalDonors, 0) || toNumber(reports?.newDonors, 0),
    active: activeDonors,
    deferred: Math.max(0, (donorTotal || donorRows.length) - activeDonors),
    newDonors: toNumber(reports?.newDonors, 0),
  };

  const fulfilment =
    typeof reports?.fulfilment === 'number'
      ? reports.fulfilment
      : typeof reports?.fulfilment === 'string'
        ? toNumber(String(reports.fulfilment).replace('%', ''))
        : requestTotal === 0
          ? 0
          : Math.round((approvedCount / requestTotal) * 100);

  const hospitals = {
    hospitals: hospitalTotal || toNumber(reports?.totalHospitals, 0),
    banks: toNumber(reports?.totalBanks, 0),
    pending: pendingCount,
    fulfilment,
  };

  const downloadStockCsv = useCallback(() => {
    const header = 'Blood Group,Available';
    const lines = stockGroups.map((g) => `${escapeCsv(g)},${toNumber(stockByGroup[g])}`);
    const footer = `Total,${stockTotal}`;
    downloadBlob(
      `stock-report-${period}.csv`,
      [header, ...lines, footer].join('\n'),
    );
    toast.success(t('admin.reports.downloadStarted'));
  }, [period, stockGroups, stockByGroup, stockTotal, t]);

  const downloadDonorCsv = useCallback(() => {
    const header = 'ID,Name,Blood Group,District,Status';
    const lines = donorRows.map((d: any) =>
      [
        escapeCsv(d?.id ?? d?._id ?? d?.donorId ?? ''),
        escapeCsv(d?.name ?? d?.donorName ?? ''),
        escapeCsv(d?.bloodGroup ?? d?.group ?? ''),
        escapeCsv(d?.district ?? d?.districtId ?? ''),
        escapeCsv(donorStatusOf(d)),
      ].join(','),
    );
    downloadBlob(`donor-report-${period}.csv`, [header, ...lines].join('\n'));
    toast.success(t('admin.reports.downloadStarted'));
  }, [donorRows, period, t]);

  const downloadHospitalCsv = useCallback(() => {
    const header = 'Hospital,District,Units,Status';
    const requestLines = requestRows.map((r: any) =>
      [
        escapeCsv(r?.hospitalName ?? r?.hospital ?? ''),
        escapeCsv(r?.districtId ?? r?.district ?? ''),
        escapeCsv(toNumber(r?.units ?? r?.quantity ?? 0)),
        escapeCsv(String(r?.status ?? '')),
      ].join(','),
    );
    const hospitalLines = hospitalRows.map((h: any) =>
      [
        escapeCsv(h?.name ?? ''),
        escapeCsv(h?.district ?? ''),
        escapeCsv(''),
        escapeCsv(String(h?.status ?? '')),
      ].join(','),
    );
    downloadBlob(
      `hospital-report-${period}.csv`,
      [header, ...requestLines, ...hospitalLines].join('\n'),
    );
    toast.success(t('admin.reports.downloadStarted'));
  }, [hospitalRows, period, requestRows, t]);

  const metricTable = (rows: { metric: string; value: string | number }[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('admin.reports.metric')}
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('admin.reports.value')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => (
            <tr key={row.metric}>
              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{row.metric}</td>
              <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={t('admin.reports.title')}
        subtitle={t('admin.reports.subtitle')}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={refetch}
            loading={loading}
          >
            {t('admin.messages.retry')}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {periods.map((p) => {
          const active = period === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              aria-pressed={active}
              className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${
                active
                  ? 'border-red-600 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-950/40 dark:text-red-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card className="mt-5">
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        </Card>
      ) : error ? (
        <Card className="mt-5">
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              {t('admin.messages.retry')}
            </Button>
          </div>
          <EmptyState title={t('admin.table.noResults')} hint={t('admin.table.noResultsHint')} />
        </Card>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader
              icon={<FileText className="h-4.5 w-4.5" />}
              title={t('admin.reports.stockReport')}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download className="h-3.5 w-3.5" />}
                  onClick={downloadStockCsv}
                >
                  {t('admin.reports.downloadPdf')}
                </Button>
              }
            />
            {stockGroups.length === 0 ? (
              <EmptyState
                title={t('admin.table.noResults')}
                hint={t('admin.table.noResultsHint')}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t('admin.donors.group')}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t('admin.inventory.available')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stockGroups.map((group) => (
                      <tr key={group}>
                        <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                          {group}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          {toNumber(stockByGroup[group])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {t('admin.reports.collections')}: {stock.collections} · {t('admin.reports.issues')}:{' '}
              {stock.issues} · {t('admin.districts.stock')}: {stock.total}
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={<Users className="h-4.5 w-4.5" />}
              title={t('admin.reports.donorReport')}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download className="h-3.5 w-3.5" />}
                  onClick={downloadDonorCsv}
                >
                  {t('admin.reports.downloadPdf')}
                </Button>
              }
            />
            {metricTable([
              { metric: t('admin.reports.newDonors'), value: donors.newDonors || donors.total },
              { metric: t('admin.donors.eligible'), value: donors.active },
              { metric: t('admin.donors.deferred'), value: donors.deferred },
            ])}
          </Card>

          <Card>
            <CardHeader
              icon={<Building2 className="h-4.5 w-4.5" />}
              title={t('admin.reports.hospitalReport')}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download className="h-3.5 w-3.5" />}
                  onClick={downloadHospitalCsv}
                >
                  {t('admin.reports.downloadPdf')}
                </Button>
              }
            />
            {metricTable([
              { metric: t('admin.districts.hospitals'), value: hospitals.hospitals },
              { metric: t('admin.districts.banks'), value: hospitals.banks },
              { metric: t('admin.requests.pending'), value: hospitals.pending },
              { metric: t('admin.reports.fulfilment'), value: `${fulfilment}%` },
            ])}
          </Card>
        </div>
      )}
    </div>
  );
}
