import { useMemo } from 'react';
import { Droplets } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { INVENTORY } from '../../data/superadminMock';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function InventoryPage() {
  const { t } = useI18n();

  const summary = useMemo(
    () => ({
      totalAvailable: INVENTORY.reduce((sum, row) => sum + row.available, 0),
      totalExpiring: INVENTORY.reduce((sum, row) => sum + row.expiringSoon, 0),
      lowGroups: INVENTORY.filter((row) => row.low).length,
    }),
    [],
  );

  const stats = [
    { label: t('admin.inventory.available'), value: summary.totalAvailable },
    { label: t('admin.inventory.expiringSoon'), value: summary.totalExpiring },
    { label: t('admin.inventory.lowStock'), value: summary.lowGroups },
  ];

  return (
    <div>
      <PageHeader title={t('admin.inventory.title')} subtitle={t('admin.inventory.subtitle')} />

      <Card>
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
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {INVENTORY.map((row) => (
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
    </div>
  );
}
