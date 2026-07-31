// src/components/Ratings/RatingCard.jsx
import React from 'react';
import { FaUserCircle, FaThumbsUp, FaThumbsDown, FaEdit, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const RatingCard = ({ rating, isOwner = false, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const isPositive = rating.score === 'positive';
    const scoreIcon = isPositive ? <FaThumbsUp className="text-green-500" /> : <FaThumbsDown className="text-red-500" />;
    const rater = rating.rater;
    const rated = rating.rated;

    return (
        <div className={`border rounded-xl p-4 bg-white dark:bg-gray-800 hover:shadow-md transition ${isPositive ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
            }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {rater?.avatar ? (
                        <img src={rater.avatar} alt={rater.name} className="w-8 h-8 rounded-full" />
                    ) : (
                        <FaUserCircle className="text-3xl text-gray-400" />
                    )}
                    <div>
                        <p className="font-medium text-sm text-gray-800 dark:text-white">
                            {t('ratings.by')} <span className="font-bold">{rater?.name}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                            {t('ratings.target')} {rated?.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        {scoreIcon}
                        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? t('ratings.positive') : t('ratings.negative')}
                        </span>
                    </span>
                    {rating.is_edited && (
                        <span className="text-xs text-gray-400">{t('ratings.edited')}</span>
                    )}
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-400 flex justify-between">
                <span>{new Date(rating.rated_at).toLocaleDateString()}</span>
                {isOwner && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit(rating)}
                            className="text-blue-500 hover:text-blue-700 transition"
                            aria-label={t('ratings.edit')}
                        >
                            <FaEdit size={14} />
                        </button>
                        <button
                            onClick={() => onDelete(rating.id)}
                            className="text-red-500 hover:text-red-700 transition"
                            aria-label={t('ratings.delete')}
                        >
                            <FaTrash size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RatingCard;