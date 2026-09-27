import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { TestTube, TriangleAlert } from 'lucide-react';
import { useUnits } from '../context/UnitContext';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';
import type { BloodUnit, TestResultInput, TestStatus } from '../data/types';
import { daysRemaining } from '../utils/expiry';
import { formatDate, todayISO } from '../utils/format';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { StatusBadge, TestStatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Field, Input, Textarea } from '../components/ui/Input';

type Filter = 'All' | TestStatus;
const FILTERS: Filter[] = ['All', 'Pending', 'Passed', 'Failed'];

function DaysLeft({ expiryDate }: { expiryDate: string }) {
  const { t } = useI18n();
  const d = daysRemaining(expiryDate);
  const tone =
    d < 0 ? 'text-rose-600 dark:text-rose-400' : d <= 7 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400';
  const label =
    d < 0
      ? t('expiry.overdueBy', { days: Math.abs(d) })
      : d === 0
        ? t('expiry.today')
        : `${d} ${t(d === 1 ? 'expiry.day' : 'expiry.days')}`;
  return <span className={`text-xs font-medium ${tone}`}>{label}</span>;
}

function TestResultForm({ unit }: { unit: BloodUnit }) {
  const { t } = useI18n();
  const { recordTest } = useUnits();

  const [screeningResult, setScreeningResult] = useState('');
  const [testedBy, setTestedBy] = useState('');
  const [testDate, setTestDate] = useState(todayISO());
  const [remarks, setRemarks] = useState('');
  const [testedByError, setTestedByError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (testStatus: TestStatus) => {
    if (loading) return;
    if (!testedBy.trim()) {
      setTestedByError(true);
      return;
    }
    setTestedByError(false);
    setLoading(true);
    const input: TestResultInput = {
      testStatus,
      screeningResult: screeningResult.trim() || undefined,
      testedBy: testedBy.trim(),
      testDate,
      remarks: remarks.trim() || undefined,
    };
    try {
      await recordTest(unit.id, input);
      toast.success(t('test.success', { id: unit.id }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-amber-200/70 bg-amber-50/50 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
      <div className="mb-3 flex items-center gap-2">
        <TestTube className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{t('test.recordResult')}</p>
      </div>

      <div className="space-y-3">
        <Field label={t('test.screeningResult')} htmlFor={`${unit.id}-result`}>
          <Textarea
            id={`${unit.id}-result`}
            rows={3}
            value={screeningResult}
            onChange={(e) => setScreeningResult(e.target.value)}
            placeholder={t('test.resultPh')}
            disabled={loading}
          />
        </Field>

        <Field label={t('test.testedBy')} htmlFor={`${unit.id}-by`} error={testedByError ? t('validation.required') : undefined} required>
          <Input
            id={`${unit.id}-by`}
            value={testedBy}
            onChange={(e) => {
              setTestedBy(e.target.value);
              if (testedByError && e.target.value.trim()) setTestedByError(false);
            }}
            placeholder={t('test.byPh')}
            disabled={loading}
            error={testedByError ? t('validation.required') : undefined}
          />
        </Field>

        <Field label={t('test.testDate')} htmlFor={`${unit.id}-date`}>
          <Input
            id={`${unit.id}-date`}
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            disabled={loading}
          />
        </Field>

        <Field label={t('test.remarks')} htmlFor={`${unit.id}-remarks`}>
          <Textarea
            id={`${unit.id}-remarks`}
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={t('test.remarksPh')}
            disabled={loading}
          />
        </Field>

        <div className="flex gap-2">
          <Button variant="success" size="sm" className="flex-1" loading={loading} disabled={loading} onClick={() => submit('Passed')}>
            {t('test.markPassed')}
          </Button>
          <Button variant="danger" size="sm" className="flex-1" loading={loading} disabled={loading} onClick={() => submit('Failed')}>
            {t('test.markFailed')}
          </Button>
        </div>

        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-rose-600 dark:text-rose-400">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t('test.failedWarn')}
        </p>
      </div>
    </div>
  );
}

function ConfirmedResult({ unit }: { unit: BloodUnit }) {
  const { t, locale } = useI18n();
  const value = (v?: string) => (v && v.trim() ? v : t('details.noValue'));

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t('test.confirmed')}</p>
        <TestStatusBadge status={unit.testStatus} />
      </div>
      <dl className="space-y-2.5">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t('test.screeningResult')}
          </dt>
          <dd className="mt-0.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{value(unit.screeningResult)}</dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t('test.testedBy')}
            </dt>
            <dd className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">{value(unit.testedBy)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t('test.testDate')}
            </dt>
            <dd className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">
              {unit.testDate ? formatDate(unit.testDate, locale) : t('details.noValue')}
            </dd>
          </div>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t('test.remarks')}
          </dt>
          <dd className="mt-0.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{value(unit.remarks)}</dd>
        </div>
      </dl>
    </div>
  );
}

function UnitRow({ unit }: { unit: BloodUnit }) {
  const { t, locale } = useI18n();
  const pending = unit.testStatus === 'Pending';

  return (
    <Card className={pending ? 'ring-1 ring-amber-300/60 dark:ring-amber-700/60' : ''}>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{unit.id}</span>
            <Badge tone="red">{unit.bloodGroup}</Badge>
            <Badge tone="slate">{t(`component.${unit.component}` as TranslationKey)}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={unit.status} />
            <TestStatusBadge status={unit.testStatus} />
            {pending ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:ring-amber-900">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                {t('testStatus.Pending')}
              </span>
            ) : null}
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t('units.district')}
              </dt>
              <dd className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{unit.district}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t('units.collectionDate')}
              </dt>
              <dd className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{formatDate(unit.collectionDate, locale)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t('units.expiryDate')}
              </dt>
              <dd className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span
                  className={
                    daysRemaining(unit.expiryDate) < 0
                      ? 'font-medium text-rose-600 dark:text-rose-400'
                      : daysRemaining(unit.expiryDate) <= 7
                        ? 'font-medium text-amber-600 dark:text-amber-400'
                        : undefined
                  }
                >
                  {formatDate(unit.expiryDate, locale)}
                </span>
                <DaysLeft expiryDate={unit.expiryDate} />
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t('units.storageLocation')}
              </dt>
              <dd className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{unit.storageLocation}</dd>
            </div>
          </dl>

          {pending ? (
            <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <TestTube className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {t('test.pendingHint')}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">{pending ? <TestResultForm unit={unit} /> : <ConfirmedResult unit={unit} />}</div>
      </div>
    </Card>
  );
}

export default function TestingPage() {
  const { t } = useI18n();
  const { units, loading, error } = useUnits();
  const [filter, setFilter] = useState<Filter>('All');

  const visible = useMemo(() => {
    const filtered = filter === 'All' ? units : units.filter((u) => u.testStatus === filter);
    return [...filtered].sort((a, b) => Number(b.testStatus === 'Pending') - Number(a.testStatus === 'Pending'));
  }, [units, filter]);

  if (loading && units.length === 0) {
    return (
      <div>
        <PageHeader title={t('test.title')} subtitle={t('test.subtitle')} />
        <Card>
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('test.title')} subtitle={t('test.subtitle')} />

      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {f === 'All' ? t('units.allTest') : t(`testStatus.${f}` as TranslationKey)}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <Card padded={false}>
          <EmptyState title={t('units.noResults')} hint={t('units.noResultsHint')} icon={<TestTube className="h-7 w-7" />} />
        </Card>
      ) : (
        <div className="space-y-4">
          {visible.map((unit) => (
            <UnitRow key={unit.id} unit={unit} />
          ))}
        </div>
      )}
    </div>
  );
}
