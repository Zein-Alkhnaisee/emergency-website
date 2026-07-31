// src/components/Courses/CourseFilters.jsx
import { useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setFilter, setCategory } from '../../redux/slices/coursesSlice';
import { FaFire, FaStar, FaChartLine, FaBookOpen, FaHeartbeat, FaShieldAlt, FaHandHoldingHeart } from 'react-icons/fa';

const FILTER_IDS = ['all', 'popular', 'topRated', 'trending'];
const FILTER_ICONS = {
  all: <FaBookOpen />,
  popular: <FaFire />,
  topRated: <FaStar />,
  trending: <FaChartLine />,
};
const FILTER_TRANSLATION_KEYS = {
  all: 'courses.all',
  popular: 'courses.popular',
  topRated: 'courses.topRated',
  trending: 'courses.trending',
};

const CATEGORY_ICONS = {
  all: <FaBookOpen />,
  'إسعافات': <FaHeartbeat />,
  'سلامة': <FaShieldAlt />,
  'نفسي': <FaHandHoldingHeart />,
};

const CourseFilters = memo(({ categories = [] }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const filter = useSelector(state => state.courses.filter);
  const category = useSelector(state => state.courses.category);

  const handleSetFilter = useCallback((id) => dispatch(setFilter(id)), [dispatch]);
  const handleSetCategory = useCallback((id) => dispatch(setCategory(id)), [dispatch]);

  const categoryOptions = [
    { id: 'all', name: t('courses.allCategories') },
    ...categories.map(cat => ({ id: String(cat.id), name: cat.name }))
  ];

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap justify-center gap-2">
        {FILTER_IDS.map(id => (
          <button
            key={id}
            onClick={() => handleSetFilter(id)}
            aria-pressed={filter === id}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              filter === id
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/25'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:text-primary'
            }`}
          >
            {FILTER_ICONS[id]}
            {t(FILTER_TRANSLATION_KEYS[id])}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {categoryOptions.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleSetCategory(cat.id)}
            aria-pressed={category === cat.id}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
              category === cat.id
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {CATEGORY_ICONS[cat.name] || <FaBookOpen />}
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
});

CourseFilters.displayName = 'CourseFilters';
export default CourseFilters;