import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Select, Textarea } from '../ui/Input';
import { useConfirm } from '../ui/ConfirmDialog';
import { useI18n } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';
import type { BloodUnit, UnitStatus } from '../../data/types';
import { UNIT_STATUSES } from '../../data/constants';
import { daysRemaining, getEffectiveStatus } from '../../utils/expiry';
import { useUnits } from '../../context/UnitContext';

interface StatusUpdateModalProps {
  unit: BloodUnit | null;
  open: boolean;
  onClose: () => void;
}

export function StatusUpdateModal({ unit, open, onClose }: StatusUpdateModalProps) {
  const { t } = useI18n();
  const { updateStatus } = useUnits();
  const [confirmNode, ask] = useConfirm();

  const [target, setTarget] = useState<UnitStatus>('Available');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (unit && open) {
      setTarget(getEffectiveStatus(unit));
      setNote('');
      setError('');
    }
  }, [unit, open]);

  if (!unit) return null;

  const apply = async (status: UnitStatus) => {
    setSaving(true);
    try {
      await updateStatus(unit.id, status, note.trim() || undefined);
      toast.success(
        t('statusModal.success', { id: unit.id, status: t(`status.${status}` as TranslationKey) }),
      );
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    setError('');
    const effective = getEffectiveStatus(unit);

    if (target === effective) {
      setError(t('statusModal.sameStatus'));
      return;
    }
    if (target === 'Available') {
      if (daysRemaining(unit.expiryDate) < 0) {
        setError(t('statusModal.blockedExpired'));
        return;
      }
      if (unit.testStatus !== 'Passed') {
        setError(t('statusModal.blockedTest'));
        return;
      }
    }

    if (target === 'Used') {
      ask({
        title: t('confirm.useTitle'),
        message: t('confirm.useMsg', { id: unit.id }),
        destructive: true,
        onConfirm: () => apply(target),
      });
      return;
    }
    if (target === 'Discarded') {
      ask({
        title: t('confirm.discardTitle'),
        message: t('confirm.discardMsg', { id: unit.id }),
        destructive: true,
        onConfirm: () => apply(target),
      });
      return;
    }

    ask({
      title: t('confirm.statusTitle'),
      message: t('confirm.statusMsg', { id: unit.id, status: t(`status.${target}` as TranslationKey) }),
      onConfirm: () => apply(target),
    });
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={t('statusModal.title')}
        subtitle={t('statusModal.subtitle', { id: unit.id })}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} loading={saving}>{t('statusModal.save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('statusModal.newStatus')} htmlFor="status-target" error={error} required>
            <Select
              id="status-target"
              value={target}
              onChange={(e) => {
                setError('');
                setTarget(e.target.value as UnitStatus);
              }}
            >
              {UNIT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}` as TranslationKey)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('statusModal.note')} htmlFor="status-note">
            <Textarea
              id="status-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('statusModal.notePh')}
            />
          </Field>
        </div>
      </Modal>
      {confirmNode}
    </>
  );
}
