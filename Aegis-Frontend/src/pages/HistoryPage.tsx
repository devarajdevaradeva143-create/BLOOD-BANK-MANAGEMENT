import { useMemo, useState } from 'react';
import { Clock, Droplet } from 'lucide-react';
import { useUnits } from '../context/UnitContext';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';
import type { BloodUnit, HistoryEvent, HistoryEventType } from '../data/types';
import { getEffectiveStatus, getExpiryStatus } from '../utils/expiry';
import { formatDate, formatDateTime, relativeTime } from '../utils/format';
import { Card, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { ExpiryBadge, StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Select } from '../components/ui/Input';

interface TimelineEntry {
  unit: BloodUnit;
  event: HistoryEvent;
}

const DOT_COLOR: Record<HistoryEventType, string> = {
  registered: 'bg-emerald-500',
  testingStarted: 'bg-sky-500',
  testCompleted: 'bg-amber-500',
  statusUpdated: 'bg-red-500',
};

function dotClass(event: HistoryEvent): string {
  if (event.type === 'testCompleted' && event.note?.includes('Failed')) return 'bg-rose-500';
  return DOT_COLOR[event.type];
}

function CountChip({ count }: { count: number }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 ring-1 ring-inset ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900">
      {count}
      <span>{t('history.events')}</span>
    </span>
  );
}

function IdentityCard({ unit }: { unit: BloodUnit }) {
  const { t, locale } = useI18n();
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="font-mono text-base font-semibold text-slate-900 dark:text-white">
          {unit.id}
        </span>
        <Badge tone="red">{unit.bloodGroup}</Badge>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t(`component.${unit.component}` as TranslationKey)}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{unit.district}</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <StatusBadge status={getEffectiveStatus(unit)} />
          <ExpiryBadge status={getExpiryStatus(unit)} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {t('units.expiryDate')}: {formatDate(unit.expiryDate, locale)}
      </p>
    </Card>
  );
}

function EventNode({ event }: { event: HistoryEvent }) {
  const { t, locale } = useI18n();
  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-900 ${dotClass(event)}`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {t(`history.event.${event.type}` as TranslationKey)}
        </p>
        {event.status ? <StatusBadge status={event.status} /> : null}
      </div>
      {event.note ? (
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {event.note}
        </p>
      ) : null}
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        {formatDateTime(event.at, locale)}
      </p>
    </li>
  );
}

export default function HistoryPage() {
  const { units, loading, getUnit } = useUnits();
  const { t, locale } = useI18n();
  const [selectedId, setSelectedId] = useState('');

  const selected = selectedId ? getUnit(selectedId) : undefined;

  const aggregated = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];
    for (const unit of units) {
      for (const event of unit.history) {
        entries.push({ unit, event });
      }
    }
    entries.sort((a, b) => new Date(b.event.at).getTime() - new Date(a.event.at).getTime());
    return entries.slice(0, 50);
  }, [units]);

  return (
    <div>
      <PageHeader title={t('history.title')} subtitle={t('history.subtitle')} />

      {loading && units.length === 0 ? (
        <Card>
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        </Card>
      ) : (
      <>
      <div className="mb-5 max-w-xs">
        <Field label={t('history.filterUnit')} htmlFor="historyUnitFilter">
          <Select
            id="historyUnitFilter"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">{t('history.allUnits')}</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.id}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {selectedId ? (
        selected ? (
          <div className="space-y-5">
            <IdentityCard unit={selected} />

            <Card>
              <CardHeader
                icon={<Clock className="h-4.5 w-4.5" />}
                title={t('history.timeline')}
                subtitle={selected.id}
                action={<CountChip count={selected.history.length} />}
              />
              {selected.history.length === 0 ? (
                <EmptyState
                  icon={<Droplet className="h-7 w-7" />}
                  title={t('history.noHistory')}
                  hint={t('history.selectPrompt')}
                />
              ) : (
                <ol className="relative space-y-6 border-l-2 border-slate-200 pl-6 dark:border-slate-700">
                  {selected.history.map((event) => (
                    <EventNode key={event.id} event={event} />
                  ))}
                  <li className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-slate-900 ring-4 ring-white dark:bg-white dark:ring-slate-900"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {t('history.currentStatus')}
                      </p>
                      <StatusBadge status={getEffectiveStatus(selected)} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {formatDateTime(selected.updatedAt, locale)} ·{' '}
                      {relativeTime(selected.updatedAt, locale)}
                    </p>
                  </li>
                </ol>
              )}
            </Card>
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<Droplet className="h-7 w-7" />}
              title={t('history.selectPrompt')}
            />
          </Card>
        )
      ) : (
        <Card>
          <CardHeader
            icon={<Clock className="h-4.5 w-4.5" />}
            title={t('history.allActivity')}
            subtitle={t('history.subtitle')}
            action={<CountChip count={aggregated.length} />}
          />
          {aggregated.length === 0 ? (
            <EmptyState
              icon={<Droplet className="h-7 w-7" />}
              title={t('history.noHistory')}
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {aggregated.map(({ unit, event }) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 first:pt-0 last:pb-0"
                >
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    {unit.id}
                  </span>
                  <StatusBadge status={getEffectiveStatus(unit)} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(`history.event.${event.type}` as TranslationKey)}
                  </span>
                  {event.status ? <StatusBadge status={event.status} /> : null}
                  {event.note ? (
                    <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {event.note}
                    </span>
                  ) : null}
                  <span className="ml-auto shrink-0 text-xs text-slate-400 dark:text-slate-500">
                    {formatDateTime(event.at, locale)} · {relativeTime(event.at, locale)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      </>
      )}
    </div>
  );
}
