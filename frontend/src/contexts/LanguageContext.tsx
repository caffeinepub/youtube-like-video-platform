import React, { createContext, useContext, useState, useCallback } from 'react';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'ar' | 'hi' | 'ja';

interface LanguageContextValue {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  currentLanguage: 'en',
  setLanguage: () => {},
});

const STORAGE_KEY = 'preferredLanguage';

function getInitialLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['en', 'es', 'fr', 'de', 'ar', 'hi', 'ja'].includes(stored)) {
      return stored as LanguageCode;
    }
  } catch {
    // ignore
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(getInitialLanguage);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setCurrentLanguage(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
