import { Moon, Sun } from 'lucide-react'
import { useLanguage } from '../context/useLanguage'
import { useTheme } from '../context/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  const isDark = theme === 'dark'
  const label = isDark ? t('theme.switchToLight') : t('theme.switchToDark')

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {isDark ? (
        <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-45 hover:scale-110" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 transition-transform duration-300 hover:rotate-12 hover:scale-110" aria-hidden="true" />
      )}
    </button>
  )
}
