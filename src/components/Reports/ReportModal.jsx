import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { submitReportThunk } from '../../redux/slices/reportsSlice';
import { showSuccess, showError } from '../../utils/toastHelpers';
import Button from '../Shared/Button';
import { FaExclamationTriangle } from 'react-icons/fa';

const REPORT_TYPES = [
    // requiresContext: which prop must be present for this type to be a valid choice.
    // user_misconduct has no linked record — it's validated server-side (same home group).
    { value: 'spam_message', labelKey: 'reports.reportSpamMessage', requiresContext: 'messageId' },
    { value: 'fake_rescue', labelKey: 'reports.reportFakeRescue', requiresContext: 'rescueParticipationId' },
    { value: 'service_no_show', labelKey: 'reports.reportServiceNoShow', requiresContext: 'serviceId' },
    { value: 'user_misconduct', labelKey: 'reports.reportUserMisconduct', requiresContext: null },
];

const ReportModal = ({
    isOpen,
    onClose,
    reportedId,
    reportedName,
    messageId = null,
    rescueParticipationId = null,
    serviceId = null,
    emergencyId = null,
}) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { submitting } = useSelector(s => s.reports || { submitting: false });

    const [reportType, setReportType] = useState('');
    const [details, setDetails] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const context = { messageId, rescueParticipationId, serviceId };
    // Only offer report types whose required linked record was actually passed in —
    // e.g. don't let the user pick "fake_rescue" from a chat-message modal, since
    // that would submit without rescue_participation_id and get rejected (422).
    const availableTypes = REPORT_TYPES.filter(
        (type) => !type.requiresContext || context[type.requiresContext]
    );

    const handleSubmit = async () => {
        if (!reportType) {
            setError(t('reports.selectReason'));
            return;
        }
        if (!reportedId) {
            setError(t('reports.noTargetUser'));
            return;
        }
        const selectedType = REPORT_TYPES.find((type) => type.value === reportType);
        if (selectedType?.requiresContext && !context[selectedType.requiresContext]) {
            setError(t('reports.missingContext'));
            return;
        }
        console.log('📤 Submitting report:', { reportType, reportedId, details, serviceId });
        setError('');
        try {
            await dispatch(submitReportThunk({
                reportType,
                reportedId,
                reportedName,
                details,
                messageId,
                rescueParticipationId,
                serviceId,
                emergencyId,
            })).unwrap();
            showSuccess(t('reports.submitSuccess'));
            onClose();
        } catch (err) {
            // ✅ ترجمة رسائل الخطأ من الباك إند
            const errorMessage = err?.toString() || '';
            let translatedError = t('reports.submitError'); // رسالة افتراضية

            if (errorMessage.includes('only report a service after completing a booking')) {
                translatedError = t('reports.errorServiceNoBooking');
            } else if (errorMessage.includes('already reported')) {
                translatedError = t('reports.errorAlreadyReported');
            } else if (errorMessage.includes('cannot report yourself')) {
                translatedError = t('reports.errorSelfReport');
            } else {
                // إذا كان الخطأ نصًا عاديًا، نعرضه مباشرة
                translatedError = err || t('reports.submitError');
            }

            showError(translatedError);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={handleOverlayClick}
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-white/10 dark:border-gray-700/50 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <FaExclamationTriangle className="text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                {t('reports.report')} {reportedName ? `- ${reportedName}` : ''}
                            </h3>
                            <p className="text-xs text-gray-500">{t('reports.reportHint')}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('reports.selectReason')}
                            </label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                            >
                                <option value="">{t('reports.selectReason')}</option>
                                {availableTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {t(type.labelKey)}
                                    </option>
                                ))}
                            </select>
                            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('reports.additionalDetails')}
                            </label>
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                                rows={3}
                                placeholder={t('reports.additionalDetails')}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <Button
                            text={t('common.cancel')}
                            bgColor="bg-gray-100 dark:bg-gray-700"
                            textColor="text-gray-700 dark:text-gray-300"
                            onClick={onClose}
                        />
                        <Button
                            text={submitting ? t('common.loading') : t('reports.report')}
                            bgColor="bg-red-500 hover:bg-red-600"
                            textColor="text-white"
                            onClick={handleSubmit}
                            disabled={submitting}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;