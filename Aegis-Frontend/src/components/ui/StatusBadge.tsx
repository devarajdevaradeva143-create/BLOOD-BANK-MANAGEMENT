import { Badge } from './Badge';
import { useI18n } from '../../i18n/I18nContext';
import type { ExpiryStatus, TestStatus, UnitStatus } from '../../data/types';
import type { TranslationKey } from '../../i18n/translations';

const statusTone: Record<UnitStatus, 'emerald' | 'amber' | 'sky' | 'zinc' | 'rose' | 'slate'> = {
  Available: 'emerald',
  UnderTesting: 'amber',
  Reserved: 'sky',
  Used: 'zinc',
  Expired: 'rose',
  Discarded: 'slate',
};

const testTone: Record<TestStatus, 'amber' | 'emerald' | 'rose'> = {
  Pending: 'amber',
  Passed: 'emerald',
  Failed: 'rose',
};

const expiryTone: Record<ExpiryStatus, 'emerald' | 'amber' | 'rose'> = {
  Safe: 'emerald',
  ExpiringSoon: 'amber',
  Expired: 'rose',
};

export function StatusBadge({ status }: { status: UnitStatus }) {
  const { t } = useI18n();
  return (
    <Badge tone={statusTone[status]} dot>
      {t(`status.${status}` as TranslationKey)}
    </Badge>
  );
}

export function TestStatusBadge({ status }: { status: TestStatus }) {
  const { t } = useI18n();
  return (
    <Badge tone={testTone[status]} dot>
      {t(`testStatus.${status}` as TranslationKey)}
    </Badge>
  );
}

export function ExpiryBadge({ status }: { status: ExpiryStatus }) {
  const { t } = useI18n();
  return (
    <Badge tone={expiryTone[status]} dot>
      {t(`expiryStatus.${status}` as TranslationKey)}
    </Badge>
  );
}
