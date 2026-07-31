import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaStar } from 'react-icons/fa';
import { createRating, updateRating, deleteRating } from '../../redux/slices/ratingsSlice';
import { showSuccess, showError } from '../../utils/toastHelpers';
import Button from '../Shared/Button';

const RateUserModal = ({ isOpen, onClose, userId, userName, groupId, existingRating }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { submitting } = useSelector(s => s.ratings);
    const [score, setScore] = useState(existingRating?.score ?? 0);
    const [hoverScore, setHoverScore] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (existingRating) {
            setScore(existingRating.score ?? 0);
        } else {
            setScore(0);
        }
        setErrorMessage('');
    }, [existingRating]);

    const handleStarClick = (value) => {
        setScore(value);
        setErrorMessage('');
    };

    const handleSubmit = async () => {
        // ✅ التحقق من وجود userId
        if (!userId) {
            const msg = 'معرف المستخدم غير صالح. يرجى إعادة المحاولة.';
            setErrorMessage(msg);
            showError(msg);
            return;
        }
        if (!userId) {
            showError('معرف المستخدم غير صالح. يرجى إعادة المحاولة.');
            return;
        }

        if (score === 0) {
            const msg = t('ratings.selectStar');
            setErrorMessage(msg);
            showError(msg);
            return;
        }

        setLoading(true);
        setErrorMessage('');
        let result;
        try {
            if (existingRating) {
                result = await dispatch(updateRating({ ratingId: existingRating.id, score }));
            } else {
                // ✅ تأكد من تمرير ratedId بشكل صحيح
                result = await dispatch(createRating({ groupId, ratedId: userId, score }));
            }
            setLoading(false);
            if (createRating.fulfilled.match(result) || updateRating.fulfilled.match(result)) {
                showSuccess(existingRating ? t('ratings.updateSuccess') : t('ratings.createSuccess'));
                onClose();
            } else {
                const errMsg = result.payload || 'حدث خطأ غير متوقع';
                setErrorMessage(errMsg);
                showError(errMsg);
            }
        } catch (err) {
            setLoading(false);
            const msg = err.message || 'حدث خطأ غير متوقع';
            setErrorMessage(msg);
            showError(msg);
        }
    };

    const handleDelete = async () => {
        if (!existingRating) return;
        if (!window.confirm(t('ratings.confirmDelete'))) return;
        setLoading(true);
        const result = await dispatch(deleteRating(existingRating.id));
        setLoading(false);
        if (deleteRating.fulfilled.match(result)) {
            showSuccess(t('ratings.deleteSuccess'));
            onClose();
        } else {
            const errMsg = result.payload || 'فشل الحذف';
            setErrorMessage(errMsg);
            showError(errMsg);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {existingRating ? t('ratings.editRating') : t('ratings.rateUser', { name: userName })}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FaTimes />
                    </button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {t('ratings.rateHint')}
                </p>

                {/* عرض رسالة الخطأ */}
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                        {errorMessage}
                    </div>
                )}

                {/* نجوم التقييم */}
                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => handleStarClick(star)}
                            onMouseEnter={() => setHoverScore(star)}
                            onMouseLeave={() => setHoverScore(0)}
                            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
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
                        {t('ratings.selectedStars', { count: score })}
                    </p>
                )}

                <div className="flex gap-3 justify-end">
                    {existingRating && (
                        <Button
                            text={t('ratings.delete')}
                            bgColor="bg-red-500"
                            textColor="text-white"
                            handler={handleDelete}
                            disabled={loading || submitting}
                        />
                    )}
                    <Button
                        text={loading || submitting ? t('common.loading') : (existingRating ? t('ratings.update') : t('ratings.submit'))}
                        bgColor="bg-primary"
                        textColor="text-white"
                        handler={handleSubmit}
                        disabled={loading || submitting || score === 0}
                    />
                </div>
            </div>
        </div>
    );
};

export default RateUserModal;