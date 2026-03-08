import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('sahaayak_lang') || 'en');
  const t = translations[lang] || translations.en;

  const langToLocale = (code) => ({ en: 'en', hi: 'hi', ta: 'ta', te: 'te', bn: 'bn' }[code] || 'en');

  useEffect(() => {
    document.documentElement.lang = langToLocale(lang);
  }, [lang]);

  const setLanguage = (newLang) => {
    if (translations[newLang]) {
      setLang(newLang);
      localStorage.setItem('sahaayak_lang', newLang);
      document.documentElement.lang = langToLocale(newLang);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLanguage, t, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
