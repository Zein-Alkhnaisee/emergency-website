import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setFilter, setCategory } from '../../redux/slices/coursesSlice';
import { FaFire, FaStar, FaChartLine, FaBookOpen, FaHeartbeat, FaShieldAlt, FaHandHoldingHeart } from 'react-icons/fa';

const CourseFilters = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { filter, category } = useSelector(state => state.courses);

    const filters = [
        { id: 'all', label: t('courses.all'), icon: <FaBookOpen /> },
        { id: 'popular', label: t('courses.popular'), icon: <FaFire /> },
        { id: 'topRated', label: t('courses.topRated'), icon: <FaStar /> },
        { id: 'trending', label: t('courses.trending'), icon: <FaChartLine /> },
    ];

    const categories = [
        { id: 'all', label: t('courses.allCategories'), icon: <FaBookOpen />, color: 'from-gray-500 to-gray-600' },
        { id: 'إسعافات', label: t('courses.catFirstAid'), icon: <FaHeartbeat />, color: 'from-green-500 to-emerald-600' },
        { id: 'سلامة', label: t('courses.catSafety'), icon: <FaShieldAlt />, color: 'from-blue-500 to-indigo-600' },
        { id: 'نفسي', label: t('courses.catPsychological'), icon: <FaHandHoldingHeart />, color: 'from-purple-500 to-pink-500' },
    ];

    return (
        <div className="mb-8 space-y-6">
            <div className="flex flex-wrap justify-center gap-3">
                {filters.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => dispatch(setFilter(f.id))}
                        className={`px-5 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-1 ${filter === f.id
                                ? 'bg-gradient-to-r from-primary to-secondary text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                            }`}
                    >
                        {f.icon} {f.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => dispatch(setCategory(cat.id))}
                        className={`px-4 py-1.5 rounded-full text-sm transition-all duration-300 flex items-center gap-2 ${category === cat.id
                                ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CourseFilters;