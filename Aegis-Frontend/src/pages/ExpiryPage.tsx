import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { CalendarClock, Clock, Droplet, TriangleAlert } from 'lucide-react';
import { useUnits } from '../context/UnitContext';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';
import type { BloodUnit } from '../data/types';
import { daysRemaining, getEffectiveStatus, getExpiryStatus } from '../utils/expiry';
import { formatDate } from '../utils/format';
import { Card, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { ExpiryBadge, StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';

type Variant = 'expired' | 'soon' | 'safe';

const rowTone: Record<Variant, string> = {
  expired: 'border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/30',
  soon: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/30',
  safe: 'border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20',
};

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function ExpiryRow({ unit, variant }: { unit: BloodUnit; variant: Variant }) {
  const { t, locale } = useI18n();
  const days = daysRemaining(unit.expiryDate);
  const percent = clampPercent(((7 - days) / 7) * 100);

  const daysTone =
    days < 0
      ? 'text-rose-600 dark:text-rose-400'
      : days === 0
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-slate-900 dark:text-white';

  return (
    <li
      className={`rounded-xl border border-slate-200 border-l-4 p-4 shadow-sm dark:border-slate-800 dark:shadow-none ${rowTone[variant]}`}
    >
      <div className="flex flex-wrap items-start gap-x-5 gap-y-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
              {unit.id}
            </span>
            <Badge tone="red">{unit.bloodGroup}</Badge>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t(`component.${unit.component}` as TranslationKey)}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{unit.district}</span>
            <span aria-hidden="true">·</span>
            <span>{unit.storageLocation}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(unit.expiryDate, locale)}</span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={getEffectiveStatus(unit)} />
            <ExpiryBadge status={getExpiryStatus(unit)} />
          </div>

          {variant === 'soon' ? (
            <div className="mt-3">
              <div
                className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950"
                role="progressbar"
                aria-valuenow={Math.round(percent)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                {t('expiry.progressLabel', { days })}
              </p>
            </div>
          ) : null}
        </div>

        <div className="ml-auto shrink-0 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('expiry.daysRemaining')}
          </p>
          <p className={`text-3xl font-semibold leading-tight tracking-tight ${daysTone}`}>
            {days < 0 ? Math.abs(days) : days}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('expiry.days')}
          </p>
          {days < 0 ? (
            <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {t('expiry.overdueBy', { days: Math.abs(days) })}
            </p>
          ) : days === 0 ? (
            <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {t('expiry.today')}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

interface SectionProps {
  icon: ReactNode;
  title: string;
  count?: number;
  units: BloodUnit[];
  variant: Variant;
}

function Section({ icon, title, count, units, variant }: SectionProps) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader
        icon={icon}
        title={title}
        action={
          count !== undefined ? (
            <Badge tone="rose">{t('expiry.expiredCount', { count })}</Badge>
          ) : undefined
        }
      />
      {units.length === 0 ? (
        <EmptyState icon={<Droplet className="h-7 w-7" />} title={t('expiry.noUnits')} />
      ) : (
        <ul className="space-y-3">
          {units.map((unit) => (
            <ExpiryRow key={unit.id} unit={unit} variant={variant} />
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function ExpiryPage() {
  const { units, loading } = useUnits();
  const { t } = useI18n();

  const buckets = useMemo(() => {
    const expired: BloodUnit[] = [];
    const soon: BloodUnit[] = [];
    const safe: BloodUnit[] = [];

    for (const unit of units) {
      const days = daysRemaining(unit.expiryDate);
      const terminal = unit.status === 'Used' || unit.status === 'Discarded';

      if (getExpiryStatus(unit) === 'Expired' || getEffectiveStatus(unit) === 'Expired') {
        expired.push(unit);
      } else if (days >= 0 && days <= 7 && !terminal) {
        soon.push(unit);
      } else if (!terminal && days > 7) {
        safe.push(unit);
      }
    }

    return { expired, soon, safe };
  }, [units]);

  return (
    <div>
      <PageHeader title={t('expiry.title')} subtitle={t('expiry.subtitle')} />

      {loading && units.length === 0 ? (
        <Card>
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
            <Spinner />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        </Card>
      ) : (
      <>
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/70 dark:bg-amber-950/40">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
          {t('expiry.lockedNote')}
        </p>
      </div>

      <div className="space-y-5">
        <Section
          icon={<CalendarClock className="h-4.5 w-4.5" />}
          title={t('expiry.sectionExpired')}
          count={buckets.expired.length}
          units={buckets.expired}
          variant="expired"
        />
        <Section
          icon={<Clock className="h-4.5 w-4.5" />}
          title={t('expiry.sectionSoon')}
          units={buckets.soon}
          variant="soon"
        />
        <Section
          icon={<Droplet className="h-4.5 w-4.5" />}
          title={t('expiry.sectionSafe')}
          units={buckets.safe}
          variant="safe"
        />
      </div>
      </>
      )}
    </div>
  );
}
