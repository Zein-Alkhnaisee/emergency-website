import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaStar, FaRegStar, FaClock, FaUserGraduate, FaDollarSign, FaFlag, FaCheckCircle, FaUpload, FaExternalLinkAlt } from 'react-icons/fa';
import { reportCourse, addCertificate } from '../../redux/slices/coursesSlice';
import Button from '../Shared/Button';

const CourseCard = ({ course, index }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { currentUser } = useSelector(state => state.user);
    const [showCertUpload, setShowCertUpload] = useState(false);
    const [certImage, setCertImage] = useState(null);

    const handleReport = () => {
        if (window.confirm(t('courses.confirmReport'))) {
            dispatch(reportCourse(course.id));
            alert(t('courses.reported'));
        }
    };

    const handleCertUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCertImage(URL.createObjectURL(file));
            dispatch(addCertificate({ userId: currentUser?.id, courseId: course.id, image: URL.createObjectURL(file) }));
            alert(t('courses.certUploaded'));
            setShowCertUpload(false);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                i <= rating ? <FaStar key={i} className="text-yellow-400" /> : <FaRegStar key={i} className="text-gray-400" />
            );
        }
        return stars;
    };

    return (
        <div
            data-aos="fade-up"
            data-aos-duration="600"
            data-aos-delay={index * 100}
            className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-700 hover:-translate-y-2"
        >
            {/* الغلاف العلوي مع شعار المنصة */}
            <div className="relative h-40 bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                <img src={course.platformIcon} alt={course.platform} className="h-12 object-contain opacity-70 group-hover:opacity-100 transition" />
                {course.price === 'مجاني' && (
                    <span className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                        {t('courses.free')}
                    </span>
                )}
                <button
                    onClick={handleReport}
                    className="absolute top-3 right-3 bg-white/80 dark:bg-gray-900/80 p-2 rounded-full hover:scale-110 transition"
                >
                    <FaFlag className="text-red-500" />
                </button>
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <span className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full">{course.category}</span>
                    <div className="flex items-center gap-1 text-sm">
                        {renderStars(course.rating)}
                        <span className="text-gray-500 ml-1">({course.rating})</span>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition">
                    {course.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">{course.description}</p>

                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1"><FaUserGraduate /> {course.studentsCount.toLocaleString()}</div>
                    <div className="flex items-center gap-1"><FaClock /> {course.duration}</div>
                    <div className="flex items-center gap-1"><FaDollarSign /> {course.price}</div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={course.teacher.avatar} alt="" className="w-8 h-8 rounded-full ring-1 ring-primary" />
                        <span className="text-sm font-medium">{course.teacher.name}</span>
                    </div>
                    <a
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/70 transition flex items-center gap-1 text-sm font-semibold"
                    >
                        {t('courses.viewCourse')} <FaExternalLinkAlt className="text-xs" />
                    </a>
                </div>

                {/* رفع الشهادة */}
                {currentUser && course.certificateRequired && (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={() => setShowCertUpload(!showCertUpload)}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            <FaUpload /> {t('courses.uploadCertificate')}
                        </button>
                        {showCertUpload && (
                            <div className="mt-2">
                                <input type="file" accept="image/*" onChange={handleCertUpload} className="text-sm" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseCard;