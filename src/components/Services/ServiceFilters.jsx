// src/components/Services/ServiceFilters.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setFilterCity, setFilterCategory } from '../../redux/slices/servicesSlice';
import { FaCity, FaTags } from 'react-icons/fa';

const ServiceFilters = ({ cities, categories }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { filterCity, filterCategory } = useSelector(s => s.services);

  // ✅ استخدام الترجمة
  const cityOptions = ['الكل', ...(cities?.map(c => c.city || c) || [])];
  const categoryOptions = [
    { id: 'الكل', name: t('services.allCategories') },
    ...(categories || [])
  ];

  return (
    <div className="mb-8 space-y-4">
      {/* ── فلترة المدينة (معبئة بالكامل) ── */}
      <div className="flex flex-wrap justify-center gap-2">
        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm font-medium">
          <FaCity /> {t('services.city')}:
        </span>
        {cityOptions.map(city => (
          <button
            key={city}
            onClick={() => dispatch(setFilterCity(city))}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              filterCity === city
                ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/25 hover:shadow-[var(--color-primary)]/40'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
            }`}
          >
            {city === 'الكل' ? t('services.allCities') : city}
          </button>
        ))}
      </div>

      {/* ── فلترة التصنيفات (إطار ونص فقط) ── */}
      <div className="flex flex-wrap justify-center gap-2">
        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm font-medium">
          <FaTags /> {t('services.category')}:
        </span>
        {categoryOptions.map(cat => (
          <button
            key={cat.id || cat}
            onClick={() => dispatch(setFilterCategory(cat.id || cat))}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              filterCategory === (cat.id || cat)
                ? 'border border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent shadow-sm shadow-[var(--color-primary)]/10'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
            }`}
          >
            {cat.name || cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServiceFilters;