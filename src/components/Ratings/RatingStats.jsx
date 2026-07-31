// src/components/Ratings/RatingStats.jsx
import React from 'react';
import { FaStar, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const RatingStats = ({ stats, className = '' }) => {
    const { t } = useTranslation();
    if (!stats) return null;

    const { total, positive, negative, positive_percent, qualifies_admin } = stats;

    return (
        <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">{t('ratings.stats')}</h4>
                <span className="text-sm text-gray-500">{total} {t('ratings.totalRatings')}</span>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <FaThumbsUp className="text-green-500" />
                    <span className="text-sm font-medium">{positive} {t('ratings.positive')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <FaThumbsDown className="text-red-500" />
                    <span className="text-sm font-medium">{negative} {t('ratings.negative')}</span>
                </div>
            </div>

            <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400"
                        style={{ width: `${Math.min(positive_percent, 100)}%` }}
                    />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {positive_percent.toFixed(1)}%
                </span>
            </div>

            {qualifies_admin && (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <FaStar className="text-yellow-500" />
                    <span>{t('ratings.qualifiesAdmin')}</span>
                </div>
            )}
        </div>
    );
};

export default RatingStats;