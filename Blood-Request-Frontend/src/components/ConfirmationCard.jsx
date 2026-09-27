import { CircleCheck, ClipboardCopy, Hash, Plus, Radio } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../context/useLanguage'
import { getDistrictName } from '../data/districts.js'

function SummaryRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900 sm:text-right dark:text-white">
        {value}
      </dd>
    </div>
  )
}

export default function ConfirmationCard({ request, onNewRequest }) {
  const { t, lang } = useLanguage()
  const [copied, setCopied] = useState(false)

  async function copyId() {
    try {
      await navigator.clipboard.writeText(request.id)
      setCopied(true)
      toast.success(t('toast.copied'))
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const summaryRows = [
    { key: 'patientName', label: t('label.patientName'), value: request.patientName },
    {
      key: 'bloodGroup',
      label: t('label.bloodGroup'),
      value: request.bloodGroup,
    },
    {
      key: 'units',
      label: t('label.units'),
      value: `${request.units} ${t('units.label')}`,
    },
    {
      key: 'district',
      label: t('label.district'),
      value: getDistrictName(request.districtId, lang),
    },
    { key: 'hospitalName', label: t('label.hospitalName'), value: request.hospitalName },
    { key: 'requestType', label: t('label.requestType'), value: t(`type.${request.requestType}`) },
  ]

  return (
    <div className="card animate-scale-in mx-auto max-w-2xl p-6 text-center sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/70 dark:text-green-400">
        <CircleCheck className="h-9 w-9" aria-hidden="true" />
      </div>

      <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
        {t('conf.title')}
      </h2>
      <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
        {t('conf.success')}
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t('conf.subtitle')}
      </p>

      <div className="mt-6 space-y-3 text-left">
        <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900/60">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Hash className="h-4 w-4" aria-hidden="true" />
            {t('conf.requestId')}
          </span>
          <span className="flex items-center gap-2">
            <code className="rounded-md bg-red-50 px-2.5 py-1 text-sm font-bold text-red-600 dark:bg-red-950/70 dark:text-red-400">
              {request.id}
            </code>
            <button
              type="button"
              onClick={copyId}
              className="btn-secondary inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
              aria-label={t('conf.requestId')}
            >
              <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
              {copied ? t('conf.copied') : t('conf.copy')}
            </button>
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900/60">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Radio className="h-4 w-4" aria-hidden="true" />
            {t('conf.status')}
          </span>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            {t('conf.submitted')}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            {t('conf.summary')}
          </h3>
          <dl className="space-y-2.5">
            {summaryRows.map((row) => (
              <SummaryRow key={row.key} label={row.label} value={row.value} />
            ))}
          </dl>
        </div>
      </div>

      <button type="button" onClick={onNewRequest} className="btn-primary mt-7 w-full sm:w-auto">
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t('conf.another')}
      </button>
    </div>
  )
}
