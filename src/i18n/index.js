import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// لا نقوم باستيراد الترجمات مسبقاً، بل سنحمّلها عند الحاجة
const resources = {};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources, // فارغ في البداية
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// دالة لتحميل الترجمة الخاصة بلغة معينة
export const loadTranslations = async (lang) => {
  try {
    const translations = await import(`./locales/${lang}.json`);
    i18n.addResourceBundle(lang, 'translation', translations.default);
    return true;
  } catch (error) {
    console.error(`Failed to load translations for ${lang}`, error);
    return false;
  }
};

// تحميل اللغة الافتراضية فوراً
const defaultLang = localStorage.getItem('i18nextLng') || 'en';
loadTranslations(defaultLang).then(() => {
  i18n.changeLanguage(defaultLang);
});

export default i18n;