import { Droplet, Phone } from 'lucide-react'
import { useLanguage } from '../context/useLanguage'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600">
                <Droplet className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold text-white">
                {t('app.name')}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              {t('footer.note')}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t('footer.emergencyTitle')}
            </h3>
            <a
              href="tel:108"
              className="mt-4 inline-flex items-center gap-2 text-3xl font-extrabold text-red-500 transition-colors hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              <Phone className="h-6 w-6" aria-hidden="true" />
              108
            </a>
            <p className="mt-1 text-xs text-slate-500">Ambulance</p>
            <a
              href="tel:104"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              <Phone className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
              104 — Health Helpline
            </a>
          </div>

        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-center text-sm text-slate-500 sm:text-left">
          <p>{t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  )
}
