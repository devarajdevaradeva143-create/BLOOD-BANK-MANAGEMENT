import { Pencil } from 'lucide-react'
import { useLanguage } from '../context/useLanguage'
import { getDistrictName } from '../data/districts.js'

const SECTIONS = [
  { id: 'patient', titleKey: 'section.patient' },
  { id: 'requirement', titleKey: 'section.requirement' },
  { id: 'district', titleKey: 'section.district' },
  { id: 'hospital', titleKey: 'section.hospital' },
  { id: 'request-type', titleKey: 'section.requestType' },
]

function Row({ label, value, error }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd
        className={`text-sm font-semibold sm:text-right ${
          error
            ? 'text-red-600 dark:text-red-400'
            : 'text-slate-900 dark:text-white'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

export default function ReviewSummary({ values, errors, onEditSection }) {
  const { t, lang } = useLanguage()

  const districtName = values.districtId
    ? getDistrictName(values.districtId, lang)
    : t('opt.select')

  const rows = [
    {
      key: 'patientName',
      label: t('label.patientName'),
      value: values.patientName || t('opt.select'),
    },
    {
      key: 'patientAge',
      label: t('label.patientAge'),
      value: values.patientAge !== '' && values.patientAge != null ? String(values.patientAge) : t('opt.select'),
    },
    {
      key: 'gender',
      label: t('label.gender'),
      value: values.gender ? t(`gender.${values.gender}`) : t('opt.select'),
    },
    {
      key: 'bloodGroup',
      label: t('label.bloodGroup'),
      value: values.bloodGroup || t('opt.select'),
    },
    {
      key: 'units',
      label: t('label.units'),
      value:
        values.units !== '' && values.units != null
          ? `${values.units} ${t('units.label')}`
          : t('opt.select'),
    },
    {
      key: 'requiredDate',
      label: t('label.requiredDate'),
      value: values.requiredDate || t('opt.select'),
    },
    {
      key: 'reason',
      label: t('label.reason'),
      value: values.reason || t('opt.select'),
    },
    { key: 'districtId', label: t('label.district'), value: districtName },
    {
      key: 'hospitalName',
      label: t('label.hospitalName'),
      value: values.hospitalName || t('opt.select'),
    },
    {
      key: 'hospitalAddress',
      label: t('label.hospitalAddress'),
      value: values.hospitalAddress || t('opt.select'),
    },
    {
      key: 'contact',
      label: t('label.contact'),
      value: values.contact || t('opt.select'),
    },
    {
      key: 'requestType',
      label: t('label.requestType'),
      value: values.requestType ? t(`type.${values.requestType}`) : t('opt.select'),
    },
  ]

  const sectionForField = {
    patientName: 'patient',
    patientAge: 'patient',
    gender: 'patient',
    bloodGroup: 'requirement',
    units: 'requirement',
    requiredDate: 'requirement',
    reason: 'requirement',
    districtId: 'district',
    hospitalName: 'hospital',
    hospitalAddress: 'hospital',
    contact: 'hospital',
    requestType: 'request-type',
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {t('review.title')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('review.confirmNote')}
          </p>
        </div>
        <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/60 dark:text-green-400 sm:mt-0">
          {t('review.ready')}
        </span>
      </div>

      <div className="space-y-5">
        {SECTIONS.map((section) => {
          const sectionRows = rows.filter(
            (row) => sectionForField[row.key] === section.id
          )
          return (
            <div
              key={section.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/50"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  {t(section.titleKey)}
                </h4>
                <button
                  type="button"
                  onClick={() => onEditSection(section.id)}
                  className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('btn.edit')}
                </button>
              </div>
              <dl className="space-y-2.5">
                {sectionRows.map((row) => (
                  <Row
                    key={row.key}
                    label={row.label}
                    value={row.value}
                    error={Boolean(errors[row.key])}
                  />
                ))}
              </dl>
            </div>
          )
        })}
      </div>
    </div>
  )
}
