import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setFilter, setCategory } from '../../redux/slices/postsSlice';
import { FaFire, FaHeart, FaComment, FaTag, FaLightbulb, FaAmbulance, FaShieldAlt, FaGraduationCap } from 'react-icons/fa';
import { MdAllInclusive } from 'react-icons/md';

const PostFilters = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { filter, category } = useSelector(state => state.posts);
  const [hoveredFilter, setHoveredFilter] = React.useState(null);
  const [hoveredCat, setHoveredCat] = React.useState(null);

  const filters = [
    { id: 'all', label: t('posts.all'), icon: <MdAllInclusive className="text-lg" />, color: 'from-gray-600 to-gray-500' },
    { id: 'trending', label: t('posts.trending'), icon: <FaFire className="text-lg" />, color: 'from-orange-500 to-red-500' },
    { id: 'mostLiked', label: t('posts.mostLiked'), icon: <FaHeart className="text-lg" />, color: 'from-pink-500 to-rose-500' },
    { id: 'mostCommented', label: t('posts.mostCommented'), icon: <FaComment className="text-lg" />, color: 'from-blue-500 to-cyan-500' },
  ];

  const categories = [
    { id: 'all', label: t('posts.allCategories'), icon: <MdAllInclusive />, color: 'from-gray-600 to-gray-500' },
    { id: 'نصائح', label: t('posts.catTips'), icon: <FaLightbulb />, color: 'from-yellow-400 to-orange-500' },
    { id: 'إسعافات', label: t('posts.catFirstAid'), icon: <FaAmbulance />, color: 'from-green-500 to-emerald-600' },
    { id: 'سلامة', label: t('posts.catSafety'), icon: <FaShieldAlt />, color: 'from-blue-500 to-indigo-600' },
    { id: 'تعليمي', label: t('posts.catEducational'), icon: <FaGraduationCap />, color: 'from-purple-500 to-violet-600' },
  ];

  return (
    <div className="space-y-8 mb-10">
      <div className="text-center" data-aos="fade-down">
        <h3 className="text-sm uppercase tracking-wider text-primary font-semibold">{t('posts.filterBy')}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('posts.discoverPosts')}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => dispatch(setFilter(f.id))}
            onMouseEnter={() => setHoveredFilter(f.id)}
            onMouseLeave={() => setHoveredFilter(null)}
            className={`relative group px-6 py-3 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center gap-3 shadow-md hover:shadow-xl ${
              filter === f.id
                ? `bg-gradient-to-r ${f.color} text-white shadow-lg ring-2 ring-offset-2 ring-primary/50`
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <span className="transition-all duration-300 group-hover:rotate-6">{f.icon}</span>
            {f.label}
            {filter === f.id && <span className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <FaTag className="text-7xl text-primary" />
        </div>
        <div className="relative flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => dispatch(setCategory(cat.id))}
              onMouseEnter={() => setHoveredCat(cat.id)}
              onMouseLeave={() => setHoveredCat(null)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 backdrop-blur-sm ${
                category === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-md scale-105 ring-2 ring-white/30`
                  : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-700/50'
              } ${hoveredCat === cat.id && category !== cat.id ? 'scale-105 shadow-md' : ''}`}
            >
              <span className={`text-lg transition-transform duration-300 ${hoveredCat === cat.id ? 'rotate-6' : ''}`}>{cat.icon}</span>
              <span className="whitespace-nowrap">{cat.label}</span>
              {category === cat.id && cat.id !== 'all' && <span className="ml-1 text-xs bg-white/30 rounded-full px-2 py-0.5">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-6 flex justify-center">
        <div className="w-24 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 rounded-full"></div>
      </div>
    </div>
  );
};

export default PostFilters;