import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Heading from './../components/Shared/Heading';
import CourseCard from '../components/Courses/CourseCard';
import CourseFilters from '../components/Courses/CourseFilters';
import Button from '../components/Shared/Button';
import { FaChalkboardTeacher } from 'react-icons/fa';

const CoursesPage = () => {
    const { t } = useTranslation();
    const { courses, filter, category } = useSelector(state => state.courses);
    const { currentUser } = useSelector(state => state.user);
    const [filteredCourses, setFilteredCourses] = useState([]);

    useEffect(() => {
        let result = [...courses];
        if (category !== 'all') {
            result = result.filter(c => c.category === category);
        }
        switch (filter) {
            case 'popular':
                result.sort((a, b) => b.studentsCount - a.studentsCount);
                break;
            case 'topRated':
                result.sort((a, b) => b.rating - a.rating);
                break;
            case 'trending':
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            default:
                break;
        }
        setFilteredCourses(result);
    }, [courses, filter, category]);

    return (
        <div className="container my-10">
            <Heading title={t('courses.title')} subtitle={t('courses.subtitle')} />

            {currentUser && (
                <div className="flex justify-end mb-6">
                    <Button
                        text={t('courses.becomeTeacher')}
                        bgColor="bg-secondary"
                        textColor="text-white"
                        handler={() => alert(t('courses.requestSent'))}
                    />
                </div>
            )}

            <CourseFilters />

            {filteredCourses.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-gray-500 dark:text-gray-400">{t('courses.noCourses')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course, idx) => (
                        <CourseCard key={course.id} course={course} index={idx} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CoursesPage;  // <-- هذا السطر مهم جداً