import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaToggleOn, FaToggleOff, FaSpinner } from 'react-icons/fa';
import { fetchMyAvailability, toggleAvailability } from '../../redux/slices/emergencyAvailabilitySlice';
import { showSuccess, showError } from '../../utils/toastHelpers';

const AvailabilityToggle = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { available_for_emergency, loading } = useSelector(state => state.emergencyAvailability);
    const { isAuthenticated, roles } = useSelector(state => state.user);
    const isTrusted = roles?.includes('trusted');
    const [isToggling, setIsToggling] = useState(false);



    useEffect(() => {
        if (isAuthenticated && isTrusted) { // ✅ فقط إذا trusted
            dispatch(fetchMyAvailability());
        }
    }, [dispatch, isAuthenticated, isTrusted]);

    if (!isAuthenticated || !isTrusted) return null;

    const handleToggle = async () => {
        if (isToggling || loading) return;
        setIsToggling(true);
        const newStatus = !available_for_emergency;
        const result = await dispatch(toggleAvailability(newStatus));
        setIsToggling(false);

        if (toggleAvailability.fulfilled.match(result)) {
            showSuccess(
                newStatus
                    ? t('emergency.availabilityEnabled', 'تم تفعيل استقبال طلبات الطوارئ')
                    : t('emergency.availabilityDisabled', 'تم تعطيل استقبال طلبات الطوارئ')
            );
        } else {
            showError(result.payload || t('common.error'));
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('emergency.availabilityStatus', 'حالة الاستقبال')}
            </span>
            <button
                onClick={handleToggle}
                disabled={isToggling || loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${available_for_emergency
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                    } hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={available_for_emergency ? t('emergency.disableAvailability') : t('emergency.enableAvailability')}
            >
                {isToggling || loading ? (
                    <FaSpinner className="animate-spin" />
                ) : available_for_emergency ? (
                    <FaToggleOn className="text-xl" />
                ) : (
                    <FaToggleOff className="text-xl" />
                )}
                <span>
                    {available_for_emergency
                        ? t('emergency.available', 'متاح')
                        : t('emergency.unavailable', 'غير متاح')}
                </span>
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-500">
                {available_for_emergency
                    ? t('emergency.receivingAlerts', 'ستصلك تنبيهات الطوارئ')
                    : t('emergency.notReceivingAlerts', 'لن تصلك تنبيهات الطوارئ')}
            </span>
        </div>
    );
};

export default AvailabilityToggle;