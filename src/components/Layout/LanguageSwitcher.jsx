import { useCallback, memo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageSwitcher = memo(() => {
  const { changeLanguage, currentLang } = useLanguage();

  const toggle = useCallback(() => {
    changeLanguage(currentLang === 'en' ? 'ar' : 'en');
  }, [changeLanguage, currentLang]);

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full font-bold text-sm hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 dark:text-gray-300"
      aria-label={`تغيير اللغة إلى ${currentLang === 'en' ? 'العربية' : 'English'}`}
    >
      {currentLang === 'en' ? 'AR' : 'EN'}
    </button>
  );
});

LanguageSwitcher.displayName = 'LanguageSwitcher';
export default LanguageSwitcher;