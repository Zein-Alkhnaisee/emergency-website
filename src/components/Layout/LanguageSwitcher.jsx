import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageSwitcher = () => {
  const { changeLanguage, currentLang } = useLanguage();
  return (
    <button onClick={() => changeLanguage(currentLang === 'en' ? 'ar' : 'en')} className="p-2 rounded-full font-bold">
      {currentLang === 'en' ? 'AR' : 'EN'}
    </button>
  );
};

export default LanguageSwitcher;