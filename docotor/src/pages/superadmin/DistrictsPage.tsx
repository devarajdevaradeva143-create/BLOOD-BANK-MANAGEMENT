import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { DISTRICTS_OVERVIEW } from '../../data/superadminMock';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

const num = 'whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300';

export default function DistrictsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DISTRICTS_OVERVIEW.filter((row) => {
      if (q && !row.district.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => b.stock - a.stock);
  }, [search]);

  return (
    <div>
      <PageHeader title={t('admin.districts.title')} subtitle={t('admin.districts.subtitle')} />

      <Card>
        <div className="w-full min-w-[180px] flex-1 sm:max-w-sm">
          <label
            htmlFor="district-search"
            className="block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            {t('common.search')}
          </label>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="district-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.table.searchPh')}
              className="pl-9"
              aria-label={t('admin.table.searchPh')}
            />
          </div>
        </div>
      </Card>

      <Card padded={false} className="mt-4 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title={t('admin.table.noResults')} hint={t('admin.table.noResultsHint')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className={th}>{t('admin.donors.district')}</th>
                    <th className={th}>{t('admin.districts.hospitals')}</th>
                    <th className={th}>{t('admin.districts.banks')}</th>
                    <th className={th}>{t('admin.districts.donors')}</th>
                    <th className={th}>{t('admin.districts.requests')}</th>
                    <th className={th}>{t('admin.districts.stock')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {filtered.map((row) => (
                    <tr
                      key={row.district}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                        {row.district}
                      </td>
                      <td className={num}>{row.hospitals.toLocaleString()}</td>
                      <td className={num}>{row.banks.toLocaleString()}</td>
                      <td className={num}>{row.donors.toLocaleString()}</td>
                      <td className={num}>{row.requests.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                        {row.stock.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {filtered.map((row) => (
                <div key={row.district} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {row.district}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {row.stock.toLocaleString()}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">
                        {t('admin.districts.hospitals')}
                      </dt>
                      <dd className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {row.hospitals.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">
                        {t('admin.districts.banks')}
                      </dt>
                      <dd className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {row.banks.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">
                        {t('admin.districts.donors')}
                      </dt>
                      <dd className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {row.donors.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">
                        {t('admin.districts.requests')}
                      </dt>
                      <dd className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {row.requests.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">
                        {t('admin.districts.stock')}
                      </dt>
                      <dd className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {row.stock.toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 px-4 py-3 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {t('admin.table.showing', {
                count: filtered.length,
                total: DISTRICTS_OVERVIEW.length,
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
