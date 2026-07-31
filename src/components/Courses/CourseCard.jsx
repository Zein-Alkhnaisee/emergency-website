// src/components/Courses/CourseCard.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  FaStar, FaRegStar, FaClock, FaUserGraduate,
  FaDollarSign, FaFlag, FaUpload, FaExternalLinkAlt,
} from 'react-icons/fa';
import { reportCourse, addCertificate } from '../../redux/slices/coursesSlice';
import RateCourseModal from './RateCourseModal';

// ── Stars ────────────────────────────────────────────────────
const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5" aria-label={`تقييم ${rating} من 5 نجوم`} role="img">
    {Array.from({ length: 5 }, (_, i) =>
      i < Math.round(rating)
        ? <FaStar key={i} className="text-yellow-400 text-xs" aria-hidden="true" />
        : <FaRegStar key={i} className="text-gray-300 dark:text-gray-600 text-xs" aria-hidden="true" />
    )}
    <span className="sr-only">{rating} من 5</span>
  </div>
);

const CourseCard = ({ course, index, isTrusted = false }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentUser = useSelector(s => s.user.currentUser);
  const [showCertUpload, setShowCertUpload] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  const {
    id,
    title,
    description,
    provider,
    official_url: url,
    language,
    duration,
    level,
    price_type,
    price,
    has_certificate: certificateRequired,
    category,
  } = course;

  const handleReport = () => {
    if (window.confirm(t('courses.confirmReport'))) {
      dispatch(reportCourse(id));
      alert(t('courses.reported'));
    }
  };

  const handleCertUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    dispatch(addCertificate({
      userId: currentUser?.id,
      courseId: id,
      image: URL.createObjectURL(file),
    }));
    alert(t('courses.certUploaded'));
    setShowCertUpload(false);
  };

  const displayPrice = price_type === 'free' ? t('courses.free') : (price ? `${price} $` : t('common.unknown'));

  return (
    <>
      <article
        data-aos="fade-up"
        data-aos-duration="500"
        data-aos-delay={Math.min(index * 80, 400)}
        className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700/60 hover:-translate-y-1 flex flex-col"
      >
        <div
          className="relative bg-gradient-to-br from-primary/8 to-secondary/8 flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: '16/7' }}
        >
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-4xl text-primary/30 group-hover:text-primary/60 transition-colors">
              📚
            </div>
          </div>

          {price_type === 'free' && (
            <span className="absolute top-3 start-3 bg-emerald-500 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">
              {t('courses.free')}
            </span>
          )}

          <button
            onClick={handleReport}
            aria-label={`الإبلاغ عن دورة ${title}`}
            className="absolute top-3 end-3 bg-white/80 dark:bg-gray-900/80 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition shadow-sm min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <FaFlag className="text-red-400 text-xs" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-center mb-3">
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium truncate max-w-[120px]">
              {category?.name || t('courses.uncategorized')}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <StarRating rating={0} />
              <span className="text-gray-500 text-xs">(0)</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mb-4 leading-relaxed flex-1">
            {description}
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <FaUserGraduate className="text-primary/60" aria-hidden="true" />
              {provider || t('courses.unknownProvider')}
            </span>
            <span className="flex items-center gap-1">
              <FaClock className="text-primary/60" aria-hidden="true" />
              {duration || t('common.unknown')}
            </span>
            <span className="flex items-center gap-1">
              <FaDollarSign className="text-primary/60" aria-hidden="true" />
              {displayPrice}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[10px] uppercase">{language || 'ar'}</span>
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">?</span>
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">
                {provider || t('courses.unknownProvider')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`عرض دورة ${title} على ${provider}`}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/70 transition-colors shrink-0 ms-2"
              >
                {t('courses.viewCourse')}
                <FaExternalLinkAlt className="text-[9px]" aria-hidden="true" />
              </a>
              {isTrusted && (
                <button
                  onClick={() => setShowRateModal(true)}
                  className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-full hover:bg-yellow-600 transition"
                >
                  {t('courses.rate')}
                </button>
              )}
            </div>
          </div>

          {currentUser && certificateRequired && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
              <button
                onClick={() => setShowCertUpload(v => !v)}
                aria-expanded={showCertUpload}
                className="text-xs text-primary hover:text-primary/70 flex items-center gap-1.5 transition-colors"
              >
                <FaUpload className="text-[10px]" aria-hidden="true" />
                {t('courses.uploadCertificate')}
              </button>
              {showCertUpload && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCertUpload}
                  aria-label="اختر صورة الشهادة"
                  className="mt-2 text-xs text-gray-500 w-full file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              )}
            </div>
          )}
        </div>
      </article>

      {showRateModal && (
        <RateCourseModal
          isOpen={showRateModal}
          onClose={() => setShowRateModal(false)}
          courseId={id}
          courseName={title}
        />
      )}
    </>
  );
};

export default CourseCard;