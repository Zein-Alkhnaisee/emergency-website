// src/components/Services/RateServiceModal.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaStar } from 'react-icons/fa';
import { rateService } from '../../redux/slices/servicesSlice';
import { showSuccess, showError } from '../../utils/toastHelpers';
import Button from '../Shared/Button';

const RateServiceModal = ({ isOpen, onClose, serviceId, serviceName, groupId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [score, setScore] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoverScore, setHoverScore] = useState(0);

  useEffect(() => {
    if (isOpen) {
      console.log('📥 RateServiceModal فُتح مع groupId:', groupId);
    }
  }, [isOpen, groupId]);

  const handleSubmit = async () => {
    if (score === 0) {
      showError(t('services.selectStar'));
      return;
    }
    if (!groupId) {
      showError(t('services.noGroup'));
      console.error('❌ groupId غير موجود!');
      return;
    }
    console.log('🚀 إرسال التقييم مع groupId:', groupId, 'score:', score);
    setLoading(true);
    const result = await dispatch(rateService({
      serviceId,
      groupId,
      score,
      review_text: review,
    }));
    setLoading(false);
    if (rateService.fulfilled.match(result)) {
      showSuccess(t('services.ratingSuccess'));
      onClose();
    } else {
      showError(result.payload || t('common.error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/10 dark:border-gray-700/50 animate-slide-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('services.rateService')} - {serviceName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 hover:rotate-90"><FaTimes /></button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('services.rateHint')}
        </p>

        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setScore(star)}
              onMouseEnter={() => setHoverScore(star)}
              onMouseLeave={() => setHoverScore(0)}
              className="text-3xl transition-all duration-200 hover:scale-125"
            >
              <FaStar
                className={`${star <= (hoverScore || score)
                    ? 'text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                  } transition-colors duration-200`}
              />
            </button>
          ))}
        </div>

        {score > 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4 animate-fade-up">
            {t('services.selectedStars', { count: score })}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('services.review')}</label>
          <textarea
            rows="3"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder={t('services.reviewPlaceholder')}
            className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200 resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            text={t('common.cancel')}
            bgColor="bg-gray-100 dark:bg-gray-700"
            textColor="text-gray-700 dark:text-gray-300"
            handler={onClose}
          />
          <Button
            text={loading ? t('common.loading') : t('services.submitRating')}
            bgColor="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
            textColor="text-white"
            handler={handleSubmit}
            disabled={loading || score === 0}
            className="shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/40"
          />
        </div>
      </div>
    </div>
  );
};

export default RateServiceModal;