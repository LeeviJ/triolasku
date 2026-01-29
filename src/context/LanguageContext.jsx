import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext()

const STORAGE_KEY = 'triolasku_language'

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved || 'fi'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const t = (key) => {
    const keys = key.split('.')
    let value = translations[language]

    for (const k of keys) {
      value = value?.[k]
    }

    return value || key
  }

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'fi' ? 'en' : 'fi'))
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
