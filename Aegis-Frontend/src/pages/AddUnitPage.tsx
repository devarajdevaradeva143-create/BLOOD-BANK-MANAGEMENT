import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nContext';
import { useUnits } from '../context/UnitContext';
import { BLOOD_GROUPS, COMPONENTS, DISTRICTS, STORAGE_LOCATIONS } from '../data/constants';
import type { BloodComponent, BloodGroup } from '../data/types';
import { todayISO } from '../utils/format';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Input';

interface FormState {
  unitId: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  district: string;
  collectionDate: string;
  expiryDate: string;
  storageLocation: string;
  quantity: string;
  collectionStaff: string;
}

type FormKey = keyof FormState;
type FormErrors = Partial<Record<FormKey, string>>;

const UNIT_ID_PATTERN = /^BU-\d{2,4}$/i;

function defaultForm(): FormState {
  return {
    unitId: '',
    bloodGroup: 'A+',
    component: 'wholeBlood',
    district: '',
    collectionDate: todayISO(),
    expiryDate: '',
    storageLocation: '',
    quantity: '1',
    collectionStaff: '',
  };
}

export default function AddUnitPage() {
  const { t } = useI18n();
  const { addUnit } = useUnits();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const setField = <K extends FormKey>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const focusFirstInvalid = (errs: FormErrors) => {
    const order: FormKey[] = [
      'unitId',
      'bloodGroup',
      'component',
      'district',
      'collectionDate',
      'expiryDate',
      'storageLocation',
      'quantity',
      'collectionStaff',
    ];
    const first = order.find((key) => errs[key]);
    if (first) {
      window.requestAnimationFrame(() => {
        document.getElementById(first)?.focus();
      });
    }
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};

    if (!form.unitId.trim()) e.unitId = t('validation.required');
    else if (!UNIT_ID_PATTERN.test(form.unitId.trim())) e.unitId = t('validation.invalidId');

    if (!form.bloodGroup) e.bloodGroup = t('validation.required');
    if (!form.component) e.component = t('validation.required');
    if (!form.district) e.district = t('validation.required');
    if (!form.collectionDate) e.collectionDate = t('validation.required');
    if (!form.expiryDate) e.expiryDate = t('validation.required');
    else if (form.collectionDate && form.expiryDate <= form.collectionDate)
      e.expiryDate = t('validation.expiryOrder');

    if (!form.storageLocation) e.storageLocation = t('validation.required');

    if (form.quantity.trim() === '') e.quantity = t('validation.required');
    else if (!Number.isFinite(Number(form.quantity)) || Number(form.quantity) < 1)
      e.quantity = t('validation.quantity');

    if (!form.collectionStaff.trim()) e.collectionStaff = t('validation.required');

    return e;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirstInvalid(errs);
      return;
    }

    setSaving(true);
    try {
      const unit = await addUnit({
        id: form.unitId.trim(),
        bloodGroup: form.bloodGroup,
        component: form.component,
        district: form.district,
        collectionDate: form.collectionDate,
        expiryDate: form.expiryDate,
        storageLocation: form.storageLocation,
        quantity: Number(form.quantity),
        collectionStaff: form.collectionStaff.trim(),
      });
      toast.success(t('add.success', { id: unit.id }));
      navigate('/units');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.error');
      setErrors({ unitId: message });
      toast.error(message);
      window.requestAnimationFrame(() => {
        document.getElementById('unitId')?.focus();
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(defaultForm());
    setErrors({});
  };

  const sectionHeadingClass =
    'text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t('add.title')}
        subtitle={t('add.subtitle')}
        action={
          <Link to="/units">
            <Button variant="outline" size="sm">
              {t('common.back')}
            </Button>
          </Link>
        }
      />

      <Card>
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <section>
            <h2 className={sectionHeadingClass}>{t('add.sectionIdentity')}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label={t('units.unitId')}
                htmlFor="unitId"
                error={errors.unitId}
                required
              >
                <Input
                  id="unitId"
                  name="unitId"
                  value={form.unitId}
                  onChange={(e) => setField('unitId', e.target.value)}
                  placeholder="BU-101"
                  autoComplete="off"
                  error={errors.unitId}
                />
              </Field>

              <Field
                label={t('units.bloodGroup')}
                htmlFor="bloodGroup"
                error={errors.bloodGroup}
                required
              >
                <Select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={(e) => setField('bloodGroup', e.target.value as BloodGroup)}
                  error={errors.bloodGroup}
                >
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="sm:col-span-2">
                <Field
                  label={t('units.component')}
                  htmlFor="component"
                  error={errors.component}
                  required
                >
                  <Select
                    id="component"
                    name="component"
                    value={form.component}
                    onChange={(e) => setField('component', e.target.value as BloodComponent)}
                    error={errors.component}
                  >
                    {COMPONENTS.map((c) => (
                      <option key={c} value={c}>
                        {t(`component.${c}`)}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          </section>

          <section>
            <h2 className={sectionHeadingClass}>{t('add.sectionCollection')}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label={t('units.district')}
                htmlFor="district"
                error={errors.district}
                required
              >
                <Select
                  id="district"
                  name="district"
                  value={form.district}
                  onChange={(e) => setField('district', e.target.value)}
                  error={errors.district}
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
                label={t('units.collectionDate')}
                htmlFor="collectionDate"
                error={errors.collectionDate}
                required
              >
                <Input
                  id="collectionDate"
                  name="collectionDate"
                  type="date"
                  value={form.collectionDate}
                  onChange={(e) => setField('collectionDate', e.target.value)}
                  error={errors.collectionDate}
                />
              </Field>

              <Field
                label={t('units.expiryDate')}
                htmlFor="expiryDate"
                error={errors.expiryDate}
                required
              >
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setField('expiryDate', e.target.value)}
                  error={errors.expiryDate}
                />
              </Field>

              <Field
                label={t('units.collectionStaff')}
                htmlFor="collectionStaff"
                error={errors.collectionStaff}
                required
              >
                <Input
                  id="collectionStaff"
                  name="collectionStaff"
                  value={form.collectionStaff}
                  onChange={(e) => setField('collectionStaff', e.target.value)}
                  placeholder="e.g. Nurse Kavitha R."
                  autoComplete="off"
                  error={errors.collectionStaff}
                />
              </Field>
            </div>
          </section>

          <section>
            <h2 className={sectionHeadingClass}>{t('add.sectionStorage')}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label={t('units.storageLocation')}
                htmlFor="storageLocation"
                error={errors.storageLocation}
                required
              >
                <Select
                  id="storageLocation"
                  name="storageLocation"
                  value={form.storageLocation}
                  onChange={(e) => setField('storageLocation', e.target.value)}
                  error={errors.storageLocation}
                >
                  <option value="">{t('validation.selectOption')}</option>
                  {STORAGE_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label={t('units.quantity')}
                htmlFor="quantity"
                error={errors.quantity}
                required
              >
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  step={1}
                  value={form.quantity}
                  onChange={(e) => setField('quantity', e.target.value)}
                  error={errors.quantity}
                />
              </Field>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleReset}
              disabled={saving}
            >
              {t('add.reset')}
            </Button>
            <Button type="submit" variant="primary" size="md" loading={saving}>
              {saving ? t('add.saving') : t('add.save')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
