import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Heading from './../components/Shared/Heading';
import CourseCard from '../components/Courses/CourseCard';
import CourseFilters from '../components/Courses/CourseFilters';
import Button from '../components/Shared/Button';
import { fetchCourses, fetchCategories } from '../redux/slices/coursesSlice';
import { SkeletonCourseCard } from '../components/UI/Skeleton';

const EmptyState = ({ message }) => (
  <div className="text-center py-16 animate-fade-up">
    <div className="text-6xl mb-4" aria-hidden="true">📚</div>
    <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
  </div>
);

const CoursesPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { courses, categories, filter, category, loading, pagination } = useSelector(state => state.courses);
  const { currentUser, roles } = useSelector(state => state.user);
  const [page, setPage] = useState(1);

  const isTrusted = roles?.includes('trusted') || currentUser?.role === 'trusted';

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const categoryId = category === 'all' ? null : category;
    dispatch(fetchCourses({ categoryId, page, perPage: 10 }));
  }, [dispatch, category, page]);

  const filteredCourses = useMemo(() => {
    let result = [...courses];
    return result;
  }, [courses, filter]);

  const handleBecomeTeacher = () => {
    alert(t('courses.requestSent'));
  };

  if (loading && courses.length === 0) {
    return (
      <div className="container my-10">
        <Heading title={t('courses.title')} subtitle={t('courses.subtitle')} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCourseCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container my-10">
      <Heading title={t('courses.title')} subtitle={t('courses.subtitle')} />

      {currentUser && (
        <div className="flex justify-end mb-6">
          <Button
            text={t('courses.becomeTeacher')}
            bgColor="bg-primary hover:bg-primary/90"
            textColor="text-white"
            handler={handleBecomeTeacher}
            className="shadow-primary hover:shadow-primary-lg"
          />
        </div>
      )}

      <CourseFilters categories={categories} />

      {filteredCourses.length === 0 ? (
        <EmptyState message={t('courses.noCourses')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course, idx) => (
            <CourseCard key={course.id} course={course} index={idx} isTrusted={isTrusted} />
          ))}
        </div>
      )}

      {pagination.lastPage > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${page === p
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/40'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;