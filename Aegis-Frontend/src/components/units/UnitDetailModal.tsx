import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { StatusBadge, ExpiryBadge, TestStatusBadge } from '../ui/StatusBadge';
import { useI18n } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';
import type { BloodUnit } from '../../data/types';
import { daysRemaining, getEffectiveStatus, getExpiryStatus } from '../../utils/expiry';
import { formatDate, formatDateTime } from '../../utils/format';

interface UnitDetailModalProps {
  unit: BloodUnit | null;
  open: boolean;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-1 dark:border-slate-800 dark:bg-slate-800/40">
        <dl className="divide-y divide-slate-200/70 dark:divide-slate-700/70">{children}</dl>
      </div>
    </section>
  );
}

const dotTone: Record<string, string> = {
  registered: 'bg-emerald-500',
  testingStarted: 'bg-amber-500',
  testCompleted: 'bg-sky-500',
  statusUpdated: 'bg-red-500',
};

export function UnitDetailModal({ unit, open, onClose }: UnitDetailModalProps) {
  const { t, locale } = useI18n();

  if (!unit) return null;

  const effective = getEffectiveStatus(unit);
  const days = daysRemaining(unit.expiryDate);
  const expiryStatus = getExpiryStatus(unit);
  const noValue = t('details.noValue');
  const history = [...unit.history].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('details.title')}
      subtitle={unit.id}
      size="lg"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {t('common.close')}
        </button>
      }
    >
      <Section title={t('details.sectionUnit')}>
        <Row label={t('units.unitId')} value={unit.id} />
        <Row label={t('units.bloodGroup')} value={unit.bloodGroup} />
        <Row label={t('units.component')} value={t(`component.${unit.component}` as TranslationKey)} />
        <Row label={t('units.district')} value={unit.district} />
        <Row label={t('units.quantity')} value={String(unit.quantity)} />
        <Row label={t('units.collectionStaff')} value={unit.collectionStaff} />
      </Section>

      <Section title={t('details.sectionTest')}>
        <div className="flex items-center justify-between gap-4 py-2">
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('units.testStatus')}
          </dt>
          <dd>
            <TestStatusBadge status={unit.testStatus} />
          </dd>
        </div>
        <Row
          label={t('test.screeningResult')}
          value={unit.screeningResult ? unit.screeningResult : noValue}
        />
        <Row label={t('test.testedBy')} value={unit.testedBy ? unit.testedBy : noValue} />
        <Row
          label={t('test.testDate')}
          value={unit.testDate ? formatDate(unit.testDate, locale) : noValue}
        />
        <Row label={t('test.remarks')} value={unit.remarks ? unit.remarks : noValue} />
      </Section>

      <Section title={t('details.sectionCollection')}>
        <Row label={t('units.collectionDate')} value={formatDate(unit.collectionDate, locale)} />
        <Row label={t('units.collectionStaff')} value={unit.collectionStaff} />
        <Row label={t('units.district')} value={unit.district} />
      </Section>

      <Section title={t('details.sectionExpiry')}>
        <Row label={t('units.expiryDate')} value={formatDate(unit.expiryDate, locale)} />
        <Row
          label={t('expiry.daysRemaining')}
          value={
            days < 0
              ? t('expiry.overdueBy', { days: Math.abs(days) })
              : days === 0
                ? t('expiry.today')
                : `${days} ${days === 1 ? t('expiry.day') : t('expiry.days')}`
          }
        />
        <div className="flex items-center justify-between gap-4 py-2">
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('units.expiryStatus')}
          </dt>
          <dd>
            <ExpiryBadge status={expiryStatus} />
          </dd>
        </div>
      </Section>

      <Section title={t('common.status')}>
        <div className="flex items-center justify-between gap-4 py-2">
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('units.unitStatus')}
          </dt>
          <dd>
            <StatusBadge status={effective} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-2">
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('units.storageLocation')}
          </dt>
          <dd className="text-right text-sm font-medium text-slate-800 dark:text-slate-200">
            {unit.storageLocation}
          </dd>
        </div>
        <Row label={t('units.lastUpdated')} value={formatDateTime(unit.updatedAt, locale)} />
      </Section>

      <Section title={t('details.sectionHistory')}>
        {history.length === 0 ? (
          <p className="py-3 text-xs text-slate-500 dark:text-slate-400">{t('history.noHistory')}</p>
        ) : (
          <ol className="relative ml-2 space-y-4 border-l border-slate-200 py-3 pl-5 dark:border-slate-700">
            {history.map((event) => (
              <li key={event.id} className="relative">
                <span
                  className={`absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${dotTone[event.type] ?? 'bg-slate-400'}`}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {t(`history.event.${event.type}` as TranslationKey)}
                  </span>
                  {event.status ? <StatusBadge status={event.status} /> : null}
                </div>
                {event.note ? (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{event.note}</p>
                ) : null}
                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                  {formatDateTime(event.at, locale)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <div className="flex flex-wrap gap-2">
        <Badge tone="slate">{unit.id}</Badge>
        <Badge tone="red">{unit.bloodGroup}</Badge>
      </div>
    </Modal>
  );
}
