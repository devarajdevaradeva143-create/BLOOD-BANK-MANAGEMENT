import { useMemo, useState } from 'react';
import { Building2, Download, FileText, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n/I18nContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  BLOOD_BANKS,
  DONORS,
  HOSPITALS,
  INVENTORY,
  REQUESTS,
} from '../../data/superadminMock';

type Period = 'daily' | 'weekly' | 'monthly';

const getStatus = (r: (typeof REQUESTS)[number]): string =>
  String((r as any).status ?? '').toLowerCase();
const getDonorStatus = (d: (typeof DONORS)[number]): string =>
  String((d as any).status ?? 'eligible').toLowerCase();
const getAvailable = (item: (typeof INVENTORY)[number]): number =>
  Number((item as any).available ?? (item as any).units ?? (item as any).stock ?? 0);
const getExpiring = (item: (typeof INVENTORY)[number]): number =>
  Number((item as any).expiring ?? (item as any).expiringSoon ?? 0);
const getGroup = (item: (typeof INVENTORY)[number]): string =>
  String((item as any).group ?? (item as any).bloodGroup ?? '');
const getBankUnits = (b: (typeof BLOOD_BANKS)[number]): number =>
  Number((b as any).units ?? (b as any).availableUnits ?? (b as any).totalUnits ?? 0);
const getRequestUnits = (r: (typeof REQUESTS)[number]): number =>
  Number((r as any).units ?? (r as any).quantity ?? 0);

export default function ReportsPage() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>('daily');

  const periods: { key: Period; label: string }[] = [
    { key: 'daily', label: t('admin.reports.daily') },
    { key: 'weekly', label: t('admin.reports.weekly') },
    { key: 'monthly', label: t('admin.reports.monthly') },
  ];

  const stock = useMemo(() => {
    const total = BLOOD_BANKS.reduce((sum, b) => sum + getBankUnits(b), 0);
    const collections = INVENTORY.reduce((sum, i) => sum + getAvailable(i), 0);
    const issues = REQUESTS
      .filter((r) => getStatus(r) === 'approved')
      .reduce((sum, r) => sum + getRequestUnits(r), 0);
    return { total, collections, issues };
  }, []);

  const donors = useMemo(() => {
    const total = DONORS.length;
    const active = DONORS.filter((d) => getDonorStatus(d) === 'eligible').length;
    return { total, active, deferred: total - active };
  }, []);

  const hospitals = useMemo(() => {
    const total = REQUESTS.length;
    const approved = REQUESTS.filter((r) => getStatus(r) === 'approved').length;
    const fulfilment = total === 0 ? 0 : Math.round((approved / total) * 100);
    return {
      hospitals: HOSPITALS.length,
      banks: BLOOD_BANKS.length,
      pending: REQUESTS.filter((r) => getStatus(r) === 'pending').length,
      fulfilment,
    };
  }, []);

  const handleDownload = () => {
    toast.success(t('admin.reports.downloadStarted'));
  };

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
      <PageHeader title={t('admin.reports.title')} subtitle={t('admin.reports.subtitle')} />

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
                onClick={handleDownload}
              >
                {t('admin.reports.downloadPdf')}
              </Button>
            }
          />
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
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('admin.inventory.expiringSoon')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {INVENTORY.map((item, index) => (
                  <tr key={`${getGroup(item)}-${index}`}>
                    <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                      {getGroup(item)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {getAvailable(item)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-amber-600 dark:text-amber-400">
                      {getExpiring(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                onClick={handleDownload}
              >
                {t('admin.reports.downloadPdf')}
              </Button>
            }
          />
          {metricTable([
            { metric: t('admin.reports.newDonors'), value: donors.total },
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
                onClick={handleDownload}
              >
                {t('admin.reports.downloadPdf')}
              </Button>
            }
          />
          {metricTable([
            { metric: t('admin.districts.hospitals'), value: hospitals.hospitals },
            { metric: t('admin.districts.banks'), value: hospitals.banks },
            { metric: t('admin.requests.pending'), value: hospitals.pending },
            { metric: t('admin.reports.fulfilment'), value: `${hospitals.fulfilment}%` },
          ])}
        </Card>
      </div>
    </div>
  );
}
