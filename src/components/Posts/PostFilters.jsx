// src/components/Posts/PostFilters.jsx
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setFilter, setCategory } from '../../redux/slices/postsSlice';
import { FaFire, FaHeart, FaComment, FaLightbulb, FaAmbulance, FaShieldAlt, FaGraduationCap } from 'react-icons/fa';
import { MdAllInclusive } from 'react-icons/md';

// ✅ استخدام الترجمة
const FILTERS = (t) => [
  { id: 'all', label: t('posts.filterAll'), icon: <MdAllInclusive /> },
  { id: 'trending', label: t('posts.filterTrending'), icon: <FaFire /> },
  { id: 'mostLiked', label: t('posts.filterMostLiked'), icon: <FaHeart /> },
  { id: 'mostCommented', label: t('posts.filterMostCommented'), icon: <FaComment /> },
];

const CATEGORIES = (t) => [
  { id: 'all', label: t('posts.allCategories'), icon: <MdAllInclusive /> },
  { id: 'نصائح', label: t('posts.categoryTips'), icon: <FaLightbulb /> },
  { id: 'إسعافات', label: t('posts.categoryFirstAid'), icon: <FaAmbulance /> },
  { id: 'سلامة', label: t('posts.categorySafety'), icon: <FaShieldAlt /> },
  { id: 'تعليمي', label: t('posts.categoryEducational'), icon: <FaGraduationCap /> },
];

const PostFilters = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { filter, category } = useSelector(s => s.posts);
  const filters = FILTERS(t);
  const categories = CATEGORIES(t);

  return (
    <div className="mb-8 space-y-3">
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <FilterChip
            key={f.id}
            active={filter === f.id}
            onClick={() => dispatch(setFilter(f.id))}
            icon={f.icon}
            label={f.label}
            variant="sort"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <FilterChip
            key={cat.id}
            active={category === cat.id}
            onClick={() => dispatch(setCategory(cat.id))}
            icon={cat.icon}
            label={cat.label}
            variant="category"
          />
        ))}
      </div>
    </div>
  );
};

const FilterChip = ({ active, onClick, icon, label, variant }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
      active
        ? variant === 'sort'
          ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/40'
          : 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 shadow-md'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
    }`}
    aria-pressed={active}
  >
    <span className="text-xs">{icon}</span>
    {label}
    {active && <span className="w-1.5 h-1.5 rounded-full bg-white/60 dark:bg-gray-600/60 ml-0.5" />}
  </button>
);

export default PostFilters;