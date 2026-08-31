'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, Language } from '@/lib/translations';

export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'pt',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('pt');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('wehost_lang') || localStorage.getItem('language')) as Language;
      if (saved === 'pt' || saved === 'en') {
        setLanguageState(saved);
        document.documentElement.lang = saved === 'pt' ? 'pt-MZ' : 'en';
      }
    } catch {
      // Ignorar erros de SSR / localStorage
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('wehost_lang', lang);
      localStorage.setItem('language', lang);
      document.documentElement.lang = lang === 'pt' ? 'pt-MZ' : 'en';
    } catch (e) {
      console.error('[LanguageContext] Erro ao salvar idioma:', e);
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const currentDict = translations[language];
      if (currentDict && currentDict[key] !== undefined) {
        return currentDict[key];
      }
      // Fallback para português se não encontrado no idioma ativo
      const ptDict = translations['pt'];
      if (ptDict && ptDict[key] !== undefined) {
        return ptDict[key];
      }
      return fallback || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
