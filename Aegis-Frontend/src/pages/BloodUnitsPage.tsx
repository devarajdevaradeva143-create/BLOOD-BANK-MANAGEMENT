import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Eye, Pencil, PlusCircle, RefreshCw } from 'lucide-react';
import { useUnits } from '../context/UnitContext';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';
import type { BloodUnit } from '../data/types';
import { daysRemaining, getEffectiveStatus, getExpiryStatus } from '../utils/expiry';
import { formatDate, relativeTime } from '../utils/format';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge, TestStatusBadge } from '../components/ui/StatusBadge';
import { Spinner } from '../components/ui/Spinner';
import { UnitFilters, emptyFilters } from '../components/units/UnitFilters';
import type { UnitFiltersValue } from '../components/units/UnitFilters';
import { UnitDetailModal } from '../components/units/UnitDetailModal';
import { UnitEditModal } from '../components/units/UnitEditModal';
import { StatusUpdateModal } from '../components/units/StatusUpdateModal';

type ModalKind = 'view' | 'edit' | 'status' | null;

export default function BloodUnitsPage() {
  const { units, loading, error } = useUnits();
  const { t, locale } = useI18n();

  const [filters, setFilters] = useState<UnitFiltersValue>({ ...emptyFilters });
  const [modal, setModal] = useState<{ kind: ModalKind; unit: BloodUnit | null }>({
    kind: null,
    unit: null,
  });

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return units.filter((unit) => {
      const effective = getEffectiveStatus(unit);
      const expiry = getExpiryStatus(unit);
      if (q && !unit.id.toLowerCase().includes(q)) return false;
      if (filters.bloodGroup && unit.bloodGroup !== filters.bloodGroup) return false;
      if (filters.district && unit.district !== filters.district) return false;
      if (filters.testStatus && unit.testStatus !== filters.testStatus) return false;
      if (filters.unitStatus && effective !== filters.unitStatus) return false;
      if (filters.expiryStatus && expiry !== filters.expiryStatus) return false;
      return true;
    });
  }, [units, filters]);

  const openModal = (kind: Exclude<ModalKind, null>, unit: BloodUnit) =>
    setModal({ kind, unit });
  const closeModal = () => setModal({ kind: null, unit: null });

  const clearFilters = () => setFilters({ ...emptyFilters });

  const actionBtn =
    'inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white';

  const renderActions = (unit: BloodUnit) => (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        className={actionBtn}
        onClick={() => openModal('view', unit)}
        aria-label={t('units.view')}
      >
        <Eye className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">{t('units.view')}</span>
      </button>
      <button
        type="button"
        className={actionBtn}
        onClick={() => openModal('edit', unit)}
        aria-label={t('units.edit')}
      >
        <Pencil className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">{t('units.edit')}</span>
      </button>
      <button
        type="button"
        className={actionBtn}
        onClick={() => openModal('status', unit)}
        aria-label={t('units.updateStatus')}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">{t('units.updateStatus')}</span>
      </button>
    </div>
  );

  const expiryCell = (unit: BloodUnit) => {
    const days = daysRemaining(unit.expiryDate);
    const isExpired = getEffectiveStatus(unit) === 'Expired';
    const isSoon = days >= 0 && days <= 7;
    return (
      <div className={isExpired ? 'text-rose-600 dark:text-rose-400' : undefined}>
        <span className="text-sm">{formatDate(unit.expiryDate, locale)}</span>
        {days <= 7 ? (
          <p
            className={`text-[11px] ${
              isExpired
                ? 'text-rose-500 dark:text-rose-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {days < 0
              ? t('expiry.overdueBy', { days: Math.abs(days) })
              : days === 0
                ? t('expiry.today')
                : `${days} ${isSoon ? (days === 1 ? t('expiry.day') : t('expiry.days')) : ''}`}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title={t('units.title')}
        subtitle={t('units.subtitle')}
        action={
          <Link
            to="/units/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          >
            <PlusCircle className="h-4 w-4" />
            {t('units.register')}
          </Link>
        }
      />

      <UnitFilters value={filters} onChange={setFilters} />

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('units.showing', { count: filtered.length, total: units.length })}
      </p>

      <Card padded className="mt-3 overflow-hidden p-0">
        {loading && units.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={t('units.noResults')}
            hint={t('units.noResultsHint')}
            action={
              <Button variant="outline" size="sm" onClick={clearFilters}>
                {t('units.clearFilters')}
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('units.unitId')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('units.bloodGroup')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('units.component')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('units.district')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('units.collectionDate')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('units.expiryDate')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('units.testStatus')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('units.unitStatus')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('units.storageLocation')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('units.lastUpdated')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('units.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {filtered.map((unit) => {
                    const effective = getEffectiveStatus(unit);
                    return (
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
                          {t(`component.${unit.component}` as TranslationKey)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                          {unit.district}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                          {formatDate(unit.collectionDate, locale)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{expiryCell(unit)}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <TestStatusBadge status={unit.testStatus} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={effective} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                          {unit.storageLocation}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {relativeTime(unit.updatedAt, locale)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{renderActions(unit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
              {filtered.map((unit) => {
                const effective = getEffectiveStatus(unit);
                const days = daysRemaining(unit.expiryDate);
                const isExpired = effective === 'Expired';
                return (
                  <div key={unit.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                        {unit.id}
                      </span>
                      <StatusBadge status={effective} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="red">{unit.bloodGroup}</Badge>
                      <TestStatusBadge status={unit.testStatus} />
                    </div>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      {unit.district} · {t(`component.${unit.component}` as TranslationKey)}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {t('units.expiryDate')}: {formatDate(unit.expiryDate, locale)}
                      {days <= 7
                        ? ` · ${days < 0 ? t('expiry.overdueBy', { days: Math.abs(days) }) : days === 0 ? t('expiry.today') : `${days} ${days === 1 ? t('expiry.day') : t('expiry.days')}`}`
                        : ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => openModal('view', unit)}
                      >
                        {t('units.view')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        onClick={() => openModal('edit', unit)}
                      >
                        {t('units.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<RefreshCw className="h-3.5 w-3.5" />}
                        onClick={() => openModal('status', unit)}
                      >
                        {t('units.updateStatus')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <UnitDetailModal
        unit={modal.kind === 'view' ? modal.unit : null}
        open={modal.kind === 'view'}
        onClose={closeModal}
      />
      <UnitEditModal
        unit={
          modal.kind === 'edit' && modal.unit
            ? { ...modal.unit }
            : null
        }
        open={modal.kind === 'edit'}
        onClose={closeModal}
      />
      <StatusUpdateModal
        unit={modal.kind === 'status' ? modal.unit : null}
        open={modal.kind === 'status'}
        onClose={closeModal}
      />
    </div>
  );
}
