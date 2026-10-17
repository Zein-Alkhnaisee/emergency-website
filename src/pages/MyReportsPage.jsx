// src/pages/MyReportsPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { deleteReportThunk, clearReports } from '../redux/slices/reportsSlice';
import Heading from '../components/Shared/Heading';
import { showSuccess, showError, confirmToast } from '../utils/toastHelpers';
import {
    FaArrowRight,
    FaTrash,
    FaClock,
    FaFlag,
} from 'react-icons/fa';

const parseApiDate = (value) => {
    if (!value) return null;
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(normalized);
    return isNaN(date.getTime()) ? null : date;
};

const REPORT_TYPE_MAP = {
    spam_message: 'reports.reportSpamMessage',
    fake_rescue: 'reports.reportFakeRescue',
    service_no_show: 'reports.reportServiceNoShow',
    user_misconduct: 'reports.reportUserMisconduct',
};

const STATUS_MAP = {
    pending: { label: 'reports.pending', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400' },
    approved: { label: 'reports.approved', color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' },
    rejected: { label: 'reports.rejected', color: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' },
};

const ReportCard = ({ report, t, onDelete }) => {
    const canDelete = report.can_delete === true;
    const statusKey = report.status || 'pending';
    const status = STATUS_MAP[statusKey] || STATUS_MAP.pending;
    const typeKey = REPORT_TYPE_MAP[report.report_type] || report.report_type;

    return (
        <div className="rounded-2xl p-5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-xl animate-fade-up">
            <div className="flex items-start gap-4">
                <span className="text-2xl shrink-0">
                    <FaFlag className="text-red-500" />
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                        <h4 className="font-bold text-gray-800 dark:text-white text-base">
                            {t(typeKey) || report.report_type}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                                {t(status.label)}
                            </span>
                            <span className="text-xs text-gray-400">{report.reported_at}</span>
                        </div>
                    </div>
                    {report.details && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{report.details}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {report.reported && (
                            <span className="flex items-center gap-1">
                                <span className="font-medium">{t('reports.reportedUser')}:</span>
                                {report.reported.name}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <FaClock className="text-gray-400" />
                            {t('reports.reportedAt')}: {parseApiDate(report.reported_at)?.toLocaleDateString('ar') || report.reported_at || '—'}
                        </span>
                    </div>
                    {canDelete && (
                        <button
                            onClick={() => onDelete(report.id)}
                            className="mt-3 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-200 flex items-center gap-1"
                        >
                            <FaTrash className="text-xs" />
                            {t('reports.delete')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const MyReportsPage = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { list, meta, loading, error, deleting } = useSelector(s => s.reports || { list: [], meta: {} });
    const [filterStatus, setFilterStatus] = useState(null);

    // ✅ لا نحاول جلب البيانات من API لأنه غير موجود حالياً
    // نعتمد فقط على البيانات المحلية المخزنة في Redux
    useEffect(() => {
        return () => {
            // ✅ فقط ننظف عند مغادرة الصفحة
            //   dispatch(clearReports());
        };
    }, [dispatch]);

    const handleDelete = (reportId) => {
        confirmToast(t('reports.confirmDelete'), async () => {
            try {
                await dispatch(deleteReportThunk(reportId)).unwrap();
                showSuccess(t('reports.deleteSuccess'));
            } catch (err) {
                // ✅ err قد يكون كائن Error أو سلسلة نصية
                const errorMsg = typeof err === 'string' ? err : err?.message || t('common.error');
                showError(errorMsg);
            }
        });
    };

    // تطبيق الفلتر محلياً
    const filteredList = list.filter(report => {
        if (!filterStatus) return true;
        return report.status === filterStatus;
    });

    return (
        <div className="container mx-auto px-4 py-6 max-w-3xl">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
            >
                <FaArrowRight /> {t('common.back')}
            </button>

            <Heading title={t('reports.title')} subtitle={t('reports.subtitle')} />

            {/* الفلاتر */}
            <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                <button
                    onClick={() => setFilterStatus(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === null
                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                >
                    {t('common.all')}
                </button>
                <button
                    onClick={() => setFilterStatus('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'pending'
                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                >
                    {t('reports.pending')}
                </button>
                <button
                    onClick={() => setFilterStatus('approved')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'approved'
                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                >
                    {t('reports.approved')}
                </button>
                <button
                    onClick={() => setFilterStatus('rejected')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'rejected'
                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                >
                    {t('reports.rejected')}
                </button>
                <span className="text-sm text-gray-400 mr-auto">
                    {t('reports.totalReports', { count: filteredList.length })}
                </span>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-600 p-4 rounded-xl mb-4 animate-fade-up">
                    {error}
                </div>
            )}

            {filteredList.length === 0 ? (
                <div className="text-center py-20 animate-fade-up">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <FaFlag className="text-3xl text-gray-300" />
                    </div>
                    <p className="text-gray-400">{t('reports.noReports')}</p>
                    <p className="text-xs text-gray-400 mt-2">
                        {t('reports.onlyLocalReports', 'البلاغات التي ترسلها ستظهر هنا فوراً')}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredList.map(report => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            t={t}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyReportsPage;