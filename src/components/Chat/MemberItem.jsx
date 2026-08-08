// src/components/Chat/MemberItem.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { fetchMemberStats, createRating } from '../../redux/slices/ratingsSlice';
import { showSuccess, showError } from '../../utils/toastHelpers';

const MemberItem = ({ member, groupId }) => {
    const dispatch = useDispatch();
    const [isHovered, setIsHovered] = useState(false);
    const [isRatingLoading, setIsRatingLoading] = useState(false);

    // جلب الإحصاءات من Redux Store
    const stats = useSelector((state) => state.ratings.memberStats[member.id]);

    // جلب الإحصاءات عند تحميل المكون أو تغيير userId
    useEffect(() => {
        if (member.id && groupId && !stats) {
            dispatch(fetchMemberStats({ userId: member.id, groupId }));
        }
    }, [member.id, groupId, dispatch, stats]);

    const handleRate = async (score) => {
        setIsRatingLoading(true);
        try {
            const result = await dispatch(createRating({ groupId, ratedId: member.id, score }));
            if (createRating.fulfilled.match(result)) {
                showSuccess('تم التقييم بنجاح!');
                // إعادة جلب الإحصاءات لهذا العضو لتحديث الرقم فوراً
                dispatch(fetchMemberStats({ userId: member.id, groupId }));
            } else {
                showError(result.payload || 'حدث خطأ أثناء التقييم');
            }
        } catch (err) {
            showError(err.message);
        } finally {
            setIsRatingLoading(false);
        }
    };

    const average = stats?.average || 0;
    const total = stats?.total || 0;
    const displayStars = Math.round(average);

    return (
        <div
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center gap-3">
                <img
                    src={member.avatar || '/default-avatar.png'}
                    alt={member.name}
                    className="w-8 h-8 rounded-full object-cover"
                />
                <span className="font-medium text-gray-800 dark:text-white text-sm">
                    {member.name}
                </span>
            </div>

            <div className="flex items-center gap-2">
                {/* العرض الدائم للتقييم */}
                {stats ? (
                    <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full text-xs">
                        <span className="text-yellow-500 flex items-center gap-0.5">
                            <FaStar className="w-3 h-3" />
                            {average.toFixed(1)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-300">({total})</span>
                    </div>
                ) : (
                    <div className="w-14 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                )}

                {/* زر التقييم يظهر عند الـ Hover */}
                {isHovered && (
                    <div className="flex items-center gap-1 transition-opacity duration-200">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => handleRate(star)}
                                disabled={isRatingLoading}
                                className={`text-gray-400 hover:text-yellow-400 transition-colors ${star <= displayStars ? 'text-yellow-400' : ''
                                    }`}
                                title={`تقييم ${star} نجوم`}
                            >
                                {star <= displayStars ? (
                                    <FaStar className="w-4 h-4" />
                                ) : (
                                    <FaRegStar className="w-4 h-4" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(MemberItem);