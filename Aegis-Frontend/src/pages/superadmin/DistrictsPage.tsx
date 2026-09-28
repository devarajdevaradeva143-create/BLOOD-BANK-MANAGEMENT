import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { DISTRICTS } from '../../data/constants';
import { getDistrictStatsFor, listDistrictsOverview } from '../../lib/api';
import type { DistrictOverviewRow } from '../../lib/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

const th =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

const num = 'whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300';

const MAJOR_DISTRICTS = [
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Salem',
  'Tiruchirappalli',
  'Vellore',
  'Tirunelveli',
];

function displayName(slugOrName: string): string {
  const found = DISTRICTS.find((d) => d.toLowerCase() === slugOrName.trim().toLowerCase());
  return found ?? slugOrName;
}

export default function DistrictsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<DistrictOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      setFallback(false);
      // Primary: aggregate endpoint GET /api/stats/districts.
      try {
        const overview = await listDistrictsOverview();
        if (cancelled) return;
        if (overview.length > 0) {
          setRows([...overview].sort((a, b) => b.stock - a.stock));
          setLoading(false);
          return;
        }
        throw new Error('Empty district overview');
      } catch {
        // Fall through to per-district fan-out — never crash, never mock.
      }
      // Fallback: per-district GET /api/stats/district?districtId= for majors.
      try {
        const settled = await Promise.allSettled(
          MAJOR_DISTRICTS.map((d) => getDistrictStatsFor(d.trim().toLowerCase())),
        );
        if (cancelled) return;
        const mapped: DistrictOverviewRow[] = [];
        for (const result of settled) {
          if (result.status !== 'fulfilled') continue;
          const s = result.value;
          mapped.push({
            district: displayName(s.district),
            hospitals: s.hospitals,
            banks: 0,
            donors: s.donors,
            requests: s.requests,
            stock: s.availableUnits,
          });
        }
        if (mapped.length === 0) {
          setRows([]);
          setError(t('common.error'));
        } else {
          setRows(mapped.sort((a, b) => b.stock - a.stock));
          setFallback(true);
          setError(null);
        }
      } catch (e) {
        if (cancelled) return;
        setRows([]);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (q && !row.district.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.stock - a.stock);
  }, [rows, search]);

  const refetch = () => setRefreshNonce((n) => n + 1);

  return (
    <div>
      <PageHeader title={t('admin.districts.title')} subtitle={t('admin.districts.subtitle')} />

      {fallback && !loading && !error ? (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
            Aggregate endpoint /api/stats/districts is unavailable — showing per-district stats for
            major districts. Bank counts are unavailable from the API.
          </p>
        </Card>
      ) : null}

      <Card className={fallback ? 'mt-4' : ''}>
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
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-14 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
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
                total: rows.length,
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
