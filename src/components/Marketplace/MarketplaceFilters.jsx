import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setFilterCategory, setFilterLocation } from '../../redux/slices/marketplaceSlice';
import { FaMapMarkerAlt, FaTag } from 'react-icons/fa';

const MarketplaceFilters = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { filterCategory, filterLocation } = useSelector(state => state.marketplace);

  const locations = [
    { id: 'all', label: t('marketplace.allLocations'), value: 'الكل' },
    { id: 'alex', label: 'الإسكندرية', value: 'الإسكندرية' },
    { id: 'cairo', label: 'القاهرة', value: 'القاهرة' },
  ];

  const categories = [
    { id: 'all', label: t('marketplace.allCategories'), value: 'الكل' },
    { id: 'pharmacy', label: t('marketplace.catPharmacy'), value: 'صيدلية' },
    { id: 'food', label: t('marketplace.catFood'), value: 'مواد غذائية' },
    { id: 'emergency', label: t('marketplace.catEmergency'), value: 'مستلزمات طوارئ' },
    { id: 'medical', label: t('marketplace.catMedical'), value: 'أجهزة طبية' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      {locations.map(loc => (
        <button
          key={loc.id}
          onClick={() => dispatch(setFilterLocation(loc.value))}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-1 ${
            filterLocation === loc.value
              ? 'bg-gradient-to-r from-primary to-secondary text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
          }`}
        >
          <FaMapMarkerAlt /> {loc.label}
        </button>
      ))}
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => dispatch(setFilterCategory(cat.value))}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
            filterCategory === cat.value
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <FaTag /> {cat.label}
        </button>
      ))}
    </div>
  );
};

export default MarketplaceFilters;