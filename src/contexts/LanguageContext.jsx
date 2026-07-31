import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { loadTranslations } from '../i18n';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();

  const changeLanguage = async (lang) => {
    // ✅ تحميل ملف الترجمة للغة الجديدة
    await loadTranslations(lang);
    // ✅ تغيير اللغة
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en';
    // تحميل اللغة المحفوظة عند بدء التشغيل
    loadTranslations(savedLang).then(() => {
      i18n.changeLanguage(savedLang);
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ changeLanguage, currentLang: i18n.language }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);