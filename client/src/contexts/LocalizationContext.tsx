import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import frTranslations from "@/locales/fr.json";
import enTranslations from "@/locales/en.json";

type Language = "fr" | "en";
type Translations = typeof frTranslations;

interface LocalizationContextType {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: Language;
  setLanguage: (language: Language) => void;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

interface LocalizationProviderProps {
  children: ReactNode;
}

export function LocalizationProvider({ children }: LocalizationProviderProps) {
  // Get saved language from localStorage or default to French
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
    // Update HTML lang attribute
    document.documentElement.lang = language;
    // Update page title
    const translations = language === 'fr' ? frTranslations : enTranslations;
    document.title = translations.app.title;
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  const getNestedValue = (obj: any, path: string): string => {
    return path.split('.').reduce((current, key) => current?.[key], obj) || path;
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translations = language === 'fr' ? frTranslations : enTranslations;
    let translation = getNestedValue(translations, key);
    
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    
    return translation;
  };

  return (
    <LocalizationContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within a LocalizationProvider");
  }
  return context;
}

// Convenience hook alias
export const useTranslation = useLocalization;
