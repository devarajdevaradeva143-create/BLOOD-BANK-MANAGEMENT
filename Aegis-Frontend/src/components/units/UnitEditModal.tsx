import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select } from '../ui/Input';
import { useI18n } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';
import type { BloodGroup, BloodComponent, NewUnitInput } from '../../data/types';
import { BLOOD_GROUPS, COMPONENTS, DISTRICTS, STORAGE_LOCATIONS } from '../../data/constants';
import { useUnits } from '../../context/UnitContext';

interface UnitEditModalProps {
  unit: NewUnitInput & { id: string } | null;
  open: boolean;
  onClose: () => void;
}

interface FormState {
  bloodGroup: BloodGroup;
  component: BloodComponent;
  district: string;
  collectionDate: string;
  expiryDate: string;
  storageLocation: string;
  quantity: string;
  collectionStaff: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState, t: (key: TranslationKey) => string): Errors {
  const errors: Errors = {};
  if (!form.bloodGroup) errors.bloodGroup = t('validation.selectOption');
  if (!form.component) errors.component = t('validation.selectOption');
  if (!form.district) errors.district = t('validation.selectOption');
  if (!form.collectionDate) errors.collectionDate = t('validation.required');
  if (!form.expiryDate) errors.expiryDate = t('validation.required');
  if (
    form.collectionDate &&
    form.expiryDate &&
    new Date(form.expiryDate) <= new Date(form.collectionDate)
  ) {
    errors.expiryDate = t('validation.expiryOrder');
  }
  if (!form.storageLocation) errors.storageLocation = t('validation.selectOption');
  const qty = Number(form.quantity);
  if (!form.quantity || Number.isNaN(qty) || qty < 1) errors.quantity = t('validation.quantity');
  if (!form.collectionStaff.trim()) errors.collectionStaff = t('validation.required');
  return errors;
}

export function UnitEditModal({ unit, open, onClose }: UnitEditModalProps) {
  const { t } = useI18n();
  const { updateUnit } = useUnits();

  const [form, setForm] = useState<FormState>({
    bloodGroup: 'O+',
    component: 'wholeBlood',
    district: '',
    collectionDate: '',
    expiryDate: '',
    storageLocation: '',
    quantity: '1',
    collectionStaff: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (unit && open) {
      setForm({
        bloodGroup: unit.bloodGroup,
        component: unit.component,
        district: unit.district,
        collectionDate: unit.collectionDate,
        expiryDate: unit.expiryDate,
        storageLocation: unit.storageLocation,
        quantity: String(unit.quantity),
        collectionStaff: unit.collectionStaff,
      });
      setErrors({});
    }
  }, [unit, open]);

  if (!unit) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate(form, t);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    try {
      const updated = await updateUnit(unit.id, {
        bloodGroup: form.bloodGroup,
        component: form.component,
        district: form.district,
        collectionDate: form.collectionDate,
        expiryDate: form.expiryDate,
        storageLocation: form.storageLocation,
        quantity: Number(form.quantity),
        collectionStaff: form.collectionStaff.trim(),
      });
      if (!updated) throw new Error(t('common.error'));
      toast.success(t('edit.success', { id: unit.id }));
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('edit.title')}
      subtitle={unit.id}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="unit-edit-form" loading={saving}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form id="unit-edit-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('units.bloodGroup')} htmlFor="edit-bloodGroup" error={errors.bloodGroup} required>
            <Select
              id="edit-bloodGroup"
              value={form.bloodGroup}
              onChange={(e) => set('bloodGroup', e.target.value as BloodGroup)}
            >
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('units.component')} htmlFor="edit-component" error={errors.component} required>
            <Select
              id="edit-component"
              value={form.component}
              onChange={(e) => set('component', e.target.value as BloodComponent)}
            >
              {COMPONENTS.map((c) => (
                <option key={c} value={c}>
                  {t(`component.${c}` as TranslationKey)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('units.district')} htmlFor="edit-district" error={errors.district} required>
            <Select
              id="edit-district"
              value={form.district}
              onChange={(e) => set('district', e.target.value)}
            >
              <option value="">{t('validation.selectOption')}</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t('units.collectionStaff')}
            htmlFor="edit-collectionStaff"
            error={errors.collectionStaff}
            required
          >
            <Input
              id="edit-collectionStaff"
              value={form.collectionStaff}
              onChange={(e) => set('collectionStaff', e.target.value)}
            />
          </Field>

          <Field
            label={t('units.collectionDate')}
            htmlFor="edit-collectionDate"
            error={errors.collectionDate}
            required
          >
            <Input
              id="edit-collectionDate"
              type="date"
              value={form.collectionDate}
              onChange={(e) => set('collectionDate', e.target.value)}
            />
          </Field>

          <Field
            label={t('units.expiryDate')}
            htmlFor="edit-expiryDate"
            error={errors.expiryDate}
            required
          >
            <Input
              id="edit-expiryDate"
              type="date"
              value={form.expiryDate}
              onChange={(e) => set('expiryDate', e.target.value)}
            />
          </Field>

          <Field
            label={t('units.storageLocation')}
            htmlFor="edit-storageLocation"
            error={errors.storageLocation}
            required
          >
            <Select
              id="edit-storageLocation"
              value={form.storageLocation}
              onChange={(e) => set('storageLocation', e.target.value)}
            >
              <option value="">{t('validation.selectOption')}</option>
              {STORAGE_LOCATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t('units.quantity')}
            htmlFor="edit-quantity"
            error={errors.quantity}
            required
          >
            <Input
              id="edit-quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => set('quantity', e.target.value)}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
