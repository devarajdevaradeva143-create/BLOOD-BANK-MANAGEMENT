import { Languages } from 'lucide-react'
import { useLanguage } from '../context/useLanguage'

export default function LanguageToggle() {
  const { lang, toggleLang, t } = useLanguage()
  const label = lang === 'en' ? t('app.switchToTamil') : t('app.switchToEnglish')

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={label}
      title={label}
      className="flex h-10 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      {lang === 'en' ? 'Tamil' : 'EN'}
    </button>
  )
}
