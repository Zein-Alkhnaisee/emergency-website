// src/components/Courses/RateCourseModal.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaStar } from 'react-icons/fa';
import { rateCourse } from '../../redux/slices/coursesSlice';
import { showSuccess, showError } from '../../utils/toastHelpers';
import Button from '../Shared/Button';

const RateCourseModal = ({ isOpen, onClose, courseId, courseName }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [score, setScore] = useState(0);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);
    const [hoverScore, setHoverScore] = useState(0);

    const handleSubmit = async () => {
        if (score === 0) {
            showError(t('courses.selectStar'));
            return;
        }
        setLoading(true);
        const result = await dispatch(rateCourse({ courseId, score, review_text: review }));
        setLoading(false);
        if (rateCourse.fulfilled.match(result)) {
            showSuccess(t('courses.ratingSuccess'));
            onClose();
        } else {
            showError(result.payload || t('common.error'));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{t('courses.rateCourse')} - {courseName}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {t('courses.rateHint')}
                </p>

                {/* نجوم التقييم */}
                <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setScore(star)}
                            onMouseEnter={() => setHoverScore(star)}
                            onMouseLeave={() => setHoverScore(0)}
                            className="text-3xl transition-transform hover:scale-110"
                        >
                            <FaStar
                                className={`${star <= (hoverScore || score)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                    } transition-colors`}
                            />
                        </button>
                    ))}
                </div>

                {score > 0 && (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {t('courses.selectedStars', { count: score })}
                    </p>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">{t('courses.review')}</label>
                    <textarea
                        rows="3"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder={t('courses.reviewPlaceholder')}
                        className="w-full p-2 border rounded dark:bg-gray-700"
                    />
                </div>

                <div className="flex gap-3 justify-end">
                    <Button text={t('common.cancel')} bgColor="bg-gray-500" textColor="text-white" handler={onClose} />
                    <Button
                        text={loading ? t('common.loading') : t('courses.submitRating')}
                        bgColor="bg-primary"
                        textColor="text-white"
                        handler={handleSubmit}
                        disabled={loading || score === 0}
                    />
                </div>
            </div>
        </div>
    );
};

export default RateCourseModal;