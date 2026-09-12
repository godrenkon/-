import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './translations';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('rpgedit_lang') || 'ja';
  });

  const setLanguage = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('rpgedit_lang', newLang);
  }, []);

  const t = useCallback((key) => {
    const dict = translations[lang] || translations.ja;
    return dict[key] ?? translations.ja[key] ?? key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLanguage: setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) return { lang: 'ja', setLanguage: () => {}, t: (k) => k };
  return ctx;
}