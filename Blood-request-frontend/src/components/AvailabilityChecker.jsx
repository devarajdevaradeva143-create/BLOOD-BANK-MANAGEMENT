import { useState } from 'react'
import { CircleCheck, CircleX, Droplets, LoaderCircle, Search, TriangleAlert } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../context/useLanguage'
import { districts, getDistrictName } from '../data/districts'
import { BLOOD_GROUPS, MAX_UNITS, MIN_UNITS } from '../data/constants'
import { fetchAvailability } from '../lib/api.js'
import FormField from './FormField'

export default function AvailabilityChecker() {
  const { lang, t } = useLanguage()
  const [districtId, setDistrictId] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [units, setUnits] = useState('1')
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})
  const [checking, setChecking] = useState(false)

  const clearError = (field) =>
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })

  const handleDistrictChange = (e) => {
    setDistrictId(e.target.value)
    clearError('districtId')
    setResult(null)
  }

  const handleBloodGroupChange = (e) => {
    setBloodGroup(e.target.value)
    clearError('bloodGroup')
    setResult(null)
  }

  const handleUnitsChange = (e) => {
    setUnits(e.target.value)
    clearError('units')
    setResult(null)
  }

  const handleCheck = async () => {
    const nextErrors = {}

    if (!districtId) nextErrors.districtId = t('err.district')
    if (!bloodGroup) nextErrors.bloodGroup = t('err.bloodGroup')

    const unitsStr = String(units).trim()
    if (!unitsStr) {
      nextErrors.units = t('err.required')
    } else {
      const n = Number(unitsStr)
      if (!Number.isInteger(n) || n < MIN_UNITS || n > MAX_UNITS) {
        nextErrors.units = t('err.unitsRange')
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setResult(null)
      return
    }

    setErrors({})
    const requiredUnits = Number(unitsStr)
    setChecking(true)
    setResult(null)
    try {
      // Single call per check — matches GET /api/availability?districtId=&bloodGroup=&units=
      // which returns { districtId, bloodGroup, available, required, isAvailable }.
      const r = await fetchAvailability(districtId, bloodGroup, requiredUnits)
      setResult({
        districtId: r.districtId ?? districtId,
        bloodGroup: r.bloodGroup ?? bloodGroup,
        units: r.required ?? requiredUnits,
        available: r.available ?? 0,
        isAvailable: Boolean(r.isAvailable),
      })
      if (!r.isAvailable) {
        toast.error(t('toast.notAvailable'))
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to check availability')
    } finally {
      setChecking(false)
    }
  }

  const statusBadge = (isAvailable) =>
    isAvailable ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
        {t('avail.available')}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-300">
        <CircleX className="h-3.5 w-3.5" aria-hidden="true" />
        {t('avail.notAvailable')}
      </span>
    )

  return (
    <section id="availability" className="scroll-mt-24 animate-fade-in">
      <div className="mb-4 flex items-start gap-3 sm:gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <Droplets className="h-full w-full" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('section.availability')}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {t('section.availabilityDesc')}
          </p>
        </div>
      </div>

      <div className="card p-5 sm:p-7 animate-fade-in-up">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label={t('label.district')}
            htmlFor="avail-district"
            required
            error={errors.districtId}
          >
            <select
              id="avail-district"
              value={districtId}
              onChange={handleDistrictChange}
              className={`input-base ${errors.districtId ? 'input-error' : ''}`}
            >
              <option value="">{t('ph.selectDistrict')}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {getDistrictName(d.id, lang)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label={t('label.bloodGroup')}
            htmlFor="avail-blood-group"
            required
            error={errors.bloodGroup}
          >
            <select
              id="avail-blood-group"
              value={bloodGroup}
              onChange={handleBloodGroupChange}
              className={`input-base ${errors.bloodGroup ? 'input-error' : ''}`}
            >
              <option value="">{t('ph.selectBloodGroup')}</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label={t('label.units')}
            htmlFor="avail-units"
            required
            error={errors.units}
          >
            <input
              id="avail-units"
              type="number"
              min={MIN_UNITS}
              max={MAX_UNITS}
              value={units}
              onChange={handleUnitsChange}
              placeholder={t('ph.units')}
              className={`input-base ${errors.units ? 'input-error' : ''}`}
            />
          </FormField>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={handleCheck}
            disabled={checking}
            className="btn-primary w-full sm:w-auto"
          >
            {checking ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t('avail.checking')}
              </>
            ) : (
              <>
                <Search className="h-4 w-4" aria-hidden="true" />
                {t('btn.check')}
              </>
            )}
          </button>
        </div>

        <div className="mt-6">
          {!result ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
              <Search
                className="h-5 w-5 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('avail.prompt')}</p>
            </div>
          ) : (
              <div
              key={`${result.districtId}-${result.bloodGroup}-${result.units}-${result.available}`}
              className="animate-scale-in rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t('avail.resultTitle')}
                </h3>
                {statusBadge(result.isAvailable)}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-6">
                <div className="min-w-[140px] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                    {t('avail.selectedDistrict')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {getDistrictName(result.districtId, lang)}
                  </p>
                </div>

                <div className="min-w-[140px] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                    {t('label.bloodGroup')}
                  </p>
                  <p className="mt-1">
                    <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-sm font-bold text-red-800 dark:bg-red-950 dark:text-red-300">
                      {result.bloodGroup}
                    </span>
                  </p>
                </div>

                <div className="min-w-[140px] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                    {t('avail.availableUnits')}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    {result.available}
                    <span className="ml-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t('units.label')}
                    </span>
                  </p>
                </div>

                <div className="min-w-[140px] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                    {t('avail.status')}
                  </p>
                  <p className="mt-1.5">{statusBadge(result.isAvailable)}</p>
                </div>
              </div>

              <p
                className={`mt-4 flex items-center gap-1.5 text-sm font-medium ${
                  result.available === 0
                    ? 'text-red-600 dark:text-red-400'
                    : result.isAvailable
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {result.available === 0 ? (
                  <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : result.isAvailable ? (
                  <CircleCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                {result.available === 0
                  ? t('avail.none')
                  : result.isAvailable
                    ? t('avail.inStock')
                    : t('avail.shortage')}
              </p>
              </div>
          )}
        </div>
      </div>
    </section>
  )
}
