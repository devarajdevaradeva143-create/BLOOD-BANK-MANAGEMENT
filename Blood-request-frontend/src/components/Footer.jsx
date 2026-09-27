import { Droplet } from 'lucide-react'
import { useLanguage } from '../context/useLanguage'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-red-600 dark:text-red-500" aria-hidden="true" />
            <span className="font-bold text-slate-900 dark:text-white">
              {t('app.name')}
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t('footer.note')}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t('footer.emergencyTitle')}
          </h3>
          <div className="mt-3 flex flex-col gap-2">
            <a
              href="tel:108"
              className="text-sm font-semibold text-slate-700 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400"
            >
              108 — Ambulance
            </a>
            <a
              href="tel:104"
              className="text-sm font-semibold text-slate-700 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400"
            >
              104 — Health Helpline
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:text-slate-400">
          <span>{t('footer.rights')}</span>
          <span>{t('footer.note')}</span>
        </div>
      </div>
    </footer>
  )
}
