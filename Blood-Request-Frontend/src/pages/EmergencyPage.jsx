import { Link } from 'react-router-dom'
import {
  CircleCheck,
  ClipboardList,
  FileText,
  Phone,
  ShieldCheck,
  Siren,
} from 'lucide-react'
import { useLanguage } from '../context/useLanguage'

import PageHeader from '../components/PageHeader'

export default function EmergencyPage() {
  const { t } = useLanguage()

  const docItems = [t('emg.s2a'), t('emg.s2b'), t('emg.s2c'), t('emg.s2d')]
  const infoItems = [t('emg.s4a'), t('emg.s4b'), t('emg.s4c'), t('emg.s4d')]
  const firstSteps = [t('emg.s1a'), t('emg.s1b'), t('emg.s1c'), t('emg.s1d')]

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={Siren}
        title={t('emg.pageTitle')}
        description={t('emg.pageSub')}
      />

      {/* Red banner */}
      <section className="card animate-fade-in-up overflow-hidden">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-red-600 to-red-700 p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Siren className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold sm:text-2xl">
              {t('emg.bannerTitle')}
            </h2>
            <p className="mt-1 text-sm text-red-100 sm:text-base">
              {t('emg.bannerDesc')}
            </p>
          </div>
          <a
            href="tel:108"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {t('emg.callNow')}
          </a>
        </div>
      </section>

      {/* Info cards */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <section className="card animate-fade-in-up p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('emg.card1Title')}
            </h3>
          </div>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
            {firstSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="card animate-fade-in-up p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('emg.card2Title')}
            </h3>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {docItems.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card animate-fade-in-up p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <Phone className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('emg.card3Title')}
            </h3>
          </div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            {t('emg.card3Desc')}
          </p>
          <Link to="/request" className="btn-primary mt-5 w-full sm:w-auto">
            {t('emg.card3Cta')}
          </Link>
        </section>

        <section className="card animate-fade-in-up p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('emg.card4Title')}
            </h3>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {infoItems.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
