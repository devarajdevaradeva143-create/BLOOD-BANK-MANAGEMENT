import { useCallback, useEffect, useMemo, useState } from 'react'
import { translations } from '../i18n/translations'
import { LanguageContext } from './LanguageContext.js'

const STORAGE_KEY = 'tnbb-lang'

function getInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'ta') return stored
  } catch {
    /* ignore */
  }
  return 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang)

  const t = useCallback(
    (key) => translations[lang]?.[key] ?? translations.en[key] ?? key,
    [lang],
  )

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'ta' : 'en'))
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang, toggleLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
