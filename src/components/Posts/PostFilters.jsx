import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setFilter, setCategory } from '../../redux/slices/postsSlice';
import { FaFire, FaHeart, FaComment, FaLightbulb, FaAmbulance, FaShieldAlt, FaGraduationCap } from 'react-icons/fa';
import { MdAllInclusive } from 'react-icons/md';

const FILTERS = [
  { id: 'all',          label: 'الكل',         icon: <MdAllInclusive /> },
  { id: 'trending',     label: 'الرائج',        icon: <FaFire />   },
  { id: 'mostLiked',    label: 'الأكثر إعجاباً', icon: <FaHeart />  },
  { id: 'mostCommented',label: 'الأكثر تعليقاً', icon: <FaComment /> },
];

const CATEGORIES = [
  { id: 'all',      label: 'الكل',      icon: <MdAllInclusive /> },
  { id: 'نصائح',    label: 'نصائح',    icon: <FaLightbulb />   },
  { id: 'إسعافات', label: 'إسعافات',  icon: <FaAmbulance />   },
  { id: 'سلامة',   label: 'سلامة',    icon: <FaShieldAlt />   },
  { id: 'تعليمي',  label: 'تعليمي',   icon: <FaGraduationCap /> },
];

const PostFilters = () => {
  const dispatch = useDispatch();
  const { filter, category } = useSelector(s => s.posts);

  return (
    <div className="mb-8 space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
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
        {CATEGORIES.map(cat => (
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
          ? 'bg-primary text-white shadow-sm shadow-primary/30'
          : 'bg-gray-800 dark:bg-white text-white dark:text-gray-900'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`}
    aria-pressed={active}
  >
    <span className="text-xs">{icon}</span>
    {label}
    {active && <span className="w-1.5 h-1.5 rounded-full bg-white/60 dark:bg-gray-600/60" />}
  </button>
);

export default PostFilters;