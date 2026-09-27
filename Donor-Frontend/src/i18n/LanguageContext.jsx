import { createContext, useContext, useEffect, useState } from "react";
import dictionaries from "./dictionaries";

const LanguageContext = createContext(null);

const dictionary = Object.assign({}, ...Object.values(dictionaries));

function getInitialLang() {
  try {
    const stored = localStorage.getItem("lang");
    if (stored === "en" || stored === "ta") return stored;
  } catch {
    /* ignore */
  }
  return "en";
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match
  );
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const t = (key, vars) => {
    const entry = dictionary[key];
    if (!entry) return key;
    const value = entry[lang] ?? entry.en ?? key;
    return interpolate(value, vars);
  };

  const toggleLang = () => setLang((prev) => (prev === "en" ? "ta" : "en"));

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
