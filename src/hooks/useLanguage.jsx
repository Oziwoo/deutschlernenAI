import { useState, useEffect, createContext, useContext } from 'react'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('lang') || 'en'
  })

  const setLang = (l) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  const toggleLang = () => {
    setLang(lang === 'en' ? 'pl' : 'en')
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
