import { Search } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { BLOOD_GROUPS, DISTRICTS, EXPIRY_STATUSES, TEST_STATUSES, UNIT_STATUSES } from '../../data/constants';
import type { BloodGroup, ExpiryStatus, TestStatus, UnitStatus } from '../../data/types';

export interface UnitFiltersValue {
  search: string;
  bloodGroup: BloodGroup | '';
  district: string;
  testStatus: TestStatus | '';
  unitStatus: UnitStatus | '';
  expiryStatus: ExpiryStatus | '';
}

export const emptyFilters: UnitFiltersValue = {
  search: '',
  bloodGroup: '',
  district: '',
  testStatus: '',
  unitStatus: '',
  expiryStatus: '',
};

interface UnitFiltersProps {
  value: UnitFiltersValue;
  onChange: (next: UnitFiltersValue) => void;
}

const selectClass =
  'text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500';

export function UnitFilters({ value, onChange }: UnitFiltersProps) {
  const { t } = useI18n();

  const set = <K extends keyof UnitFiltersValue>(key: K, next: UnitFiltersValue[K]) =>
    onChange({ ...value, [key]: next });

  const hasActiveFilters =
    value.search !== '' ||
    value.bloodGroup !== '' ||
    value.district !== '' ||
    value.testStatus !== '' ||
    value.unitStatus !== '' ||
    value.expiryStatus !== '';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full min-w-[180px] flex-1 sm:w-auto">
          <label
            htmlFor="unit-search"
            className="block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            {t('units.filters')}
          </label>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="unit-search"
              value={value.search}
              onChange={(e) => set('search', e.target.value)}
              placeholder={t('units.searchPlaceholder')}
              className="pl-9"
              aria-label={t('units.searchPlaceholder')}
            />
          </div>
        </div>

        <div className="min-w-[150px] flex-1 sm:flex-none">
          <label
            htmlFor="filter-group"
            className="block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            {t('units.bloodGroup')}
          </label>
          <Select
            id="filter-group"
            className={`mt-1.5 ${selectClass}`}
            value={value.bloodGroup}
            onChange={(e) => set('bloodGroup', e.target.value as BloodGroup | '')}
          >
            <option value="">{t('units.allGroups')}</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-[150px] flex-1 sm:flex-none">
          <label
            htmlFor="filter-district"
            className="block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            {t('units.district')}
          </label>
          <Select
            id="filter-district"
            className={`mt-1.5 ${selectClass}`}
            value={value.district}
            onChange={(e) => set('district', e.target.value)}
          >
            <option value="">{t('units.allDistricts')}</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-[150px] flex-1 sm:flex-none">
          <label
            htmlFor="filter-test"
            className="block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            {t('units.testStatus')}
          </label>
          <Select
            id="filter-test"
            className={`mt-1.5 ${selectClass}`}
            value={value.testStatus}
            onChange={(e) => set('testStatus', e.target.value as TestStatus | '')}
          >
            <option value="">{t('units.allTest')}</option>
            {TEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`testStatus.${s}` as TranslationKey)}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-[150px] flex-1 sm:flex-none">
          <label
            htmlFor="filter-unit"
            className="block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            {t('units.unitStatus')}
          </label>
          <Select
            id="filter-unit"
            className={`mt-1.5 ${selectClass}`}
            value={value.unitStatus}
            onChange={(e) => set('unitStatus', e.target.value as UnitStatus | '')}
          >
            <option value="">{t('units.allUnit')}</option>
            {UNIT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}` as TranslationKey)}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-[150px] flex-1 sm:flex-none">
          <label
            htmlFor="filter-expiry"
            className="block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            {t('units.expiryStatus')}
          </label>
          <Select
            id="filter-expiry"
            className={`mt-1.5 ${selectClass}`}
            value={value.expiryStatus}
            onChange={(e) => set('expiryStatus', e.target.value as ExpiryStatus | '')}
          >
            <option value="">{t('units.allExpiry')}</option>
            {EXPIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`expiryStatus.${s}` as TranslationKey)}
              </option>
            ))}
          </Select>
        </div>

        {hasActiveFilters ? (
          <Button variant="outline" size="md" onClick={() => onChange({ ...emptyFilters })}>
            {t('units.clearFilters')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
