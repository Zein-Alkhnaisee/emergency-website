import { useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setFilterCategory, setFilterLocation } from '../../redux/slices/marketplaceSlice';
import { FaMapMarkerAlt, FaTag } from 'react-icons/fa';

// Static — outside component
const LOCATION_VALUES = ['الكل', 'اللاذقية', 'طرطوس'];
const LOCATION_KEYS = ['marketplace.allLocations', 'اللاذقية', 'طرطوس'];

const CATEGORY_VALUES = ['الكل', 'صيدلية', 'مواد غذائية', 'مستلزمات طوارئ', 'أجهزة طبية'];
const CATEGORY_KEYS = [
  'marketplace.allCategories',
  'marketplace.catPharmacy',
  'marketplace.catFood',
  'marketplace.catEmergency',
  'marketplace.catMedical',
];

const MarketplaceFilters = memo(() => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const filterCategory = useSelector(state => state.marketplace.filterCategory);
  const filterLocation = useSelector(state => state.marketplace.filterLocation);

  const handleLocation = useCallback((val) => dispatch(setFilterLocation(val)), [dispatch]);
  const handleCategory = useCallback((val) => dispatch(setFilterCategory(val)), [dispatch]);

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {LOCATION_VALUES.map((val, i) => (
        <button
          key={val}
          onClick={() => handleLocation(val)}
          aria-pressed={filterLocation === val}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
            filterLocation === val
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:text-primary'
          }`}
        >
          <FaMapMarkerAlt className="text-xs" />
          {t(LOCATION_KEYS[i]) || val}
        </button>
      ))}

      <div className="w-full h-px bg-gray-100 dark:bg-gray-800 my-1" />

      {CATEGORY_VALUES.map((val, i) => (
        <button
          key={val}
          onClick={() => handleCategory(val)}
          aria-pressed={filterCategory === val}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
            filterCategory === val
              ? 'bg-primary/15 text-primary border border-primary/40'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <FaTag className="text-xs" />
          {t(CATEGORY_KEYS[i])}
        </button>
      ))}
    </div>
  );
});

MarketplaceFilters.displayName = 'MarketplaceFilters';
export default MarketplaceFilters;