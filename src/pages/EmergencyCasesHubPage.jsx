// src/pages/EmergencyCasesHubPage.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    fetchMyReports,
    fetchMyParticipations,
    fetchExploreCases,
    fetchReceivedRequests,
} from '../redux/slices/emergencyCasesSlice';
import Heading from '../components/Shared/Heading';
import {
    FaFire, FaCar, FaHeartbeat, FaExclamationTriangle,
    FaMapMarkerAlt, FaClock, FaUsers,
} from 'react-icons/fa';
import { formatDate } from '../utils/dateHelpers';

// ── خرائط العرض (مطابقة لنفس النمط المستخدم بباقي صفحات الطوارئ) ──
const CASE_ICON = {
    fire: <FaFire className="text-red-500" />,
    accident: <FaCar className="text-orange-500" />,
    medical: <FaHeartbeat className="text-pink-500" />,
    other: <FaExclamationTriangle className="text-yellow-500" />,
};

// ── التبويبات الأربعة ──
const TABS = [
    { key: 'myReports', labelKey: 'emergency.myReportsTab' },
    { key: 'myParticipations', labelKey: 'emergency.myParticipationsTab' },
    { key: 'explore', labelKey: 'emergency.exploreTab' },
    { key: 'received', labelKey: 'emergency.receivedTab' },
];

// ── فلاتر فرعية (Chips) — نفس الأربعة حالات لكل التبويبات ──
const SUB_FILTERS = [
    { key: 'ALL', labelKey: 'emergency.filterAll', params: {} },
    { key: 'NEW', labelKey: 'emergency.filterNew', params: { status: 'new' } },
    { key: 'IN_PROGRESS', labelKey: 'emergency.filterInProgress', params: { status: 'in_progress' } },
    { key: 'CAPACITY_REACHED', labelKey: 'emergency.filterCapacityReached', params: { status: 'completed_quota' } },
    // ✅ FINISHED = resolved + false مع بعض (status_group=closed حسب توثيق الباك)
    { key: 'FINISHED', labelKey: 'emergency.filterFinished', params: { status_group: 'closed' } },
];

const TAB_CONFIG = {
    myReports: { thunk: fetchMyReports, sliceKey: 'myReports', emptyKey: 'emergency.noMyReports', route: 'cases' },
    myParticipations: { thunk: fetchMyParticipations, sliceKey: 'myParticipations', emptyKey: 'emergency.noMyParticipations', route: 'cases' },
    explore: { thunk: fetchExploreCases, sliceKey: 'explore', emptyKey: 'emergency.noExploreCases', route: 'cases' },
    received: { thunk: fetchReceivedRequests, sliceKey: 'receivedRequests', emptyKey: 'emergency.noRescueRequests', route: 'rescue-requests' },
};

const STATUS_LABEL_KEY = {
    new: 'emergency.statusNew',
    in_progress: 'emergency.statusInProgress',
    completed_quota: 'emergency.statusCompletedQuota',
    resolved: 'emergency.statusResolved',
    closed: 'emergency.statusClosed',
    false: 'emergency.statusFalse',
};

const STATUS_COLOR = {
    new: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
    completed_quota: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
    resolved: 'text-gray-600 bg-gray-100 dark:bg-gray-700',
    closed: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
    false: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
};

// ── بطاقة عرض حالة واحدة ──
const CaseCard = ({ item, t, onClick }) => {
    const statusKey = STATUS_LABEL_KEY[item.status] ? item.status : 'new';
    return (
        <div
            onClick={onClick}
            className="rounded-2xl p-5 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 cursor-pointer animate-fade-up"
        >
            <div className="flex items-start gap-4">
                <span className="text-3xl shrink-0">{CASE_ICON[item.case_type] || CASE_ICON.other}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                        <h4 className="font-bold text-gray-800 dark:text-white text-base">
                            {t(`emergency.${item.case_type}`) || item.case_type}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[item.status] || 'bg-gray-100 text-gray-600'}`}>
                                {t(STATUS_LABEL_KEY[statusKey])}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                        </div>
                    </div>
                    {item.custom_text && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{item.custom_text}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <span className="flex items-center gap-1">
                            <FaMapMarkerAlt className="text-primary" />
                            {item.group?.name || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                            <FaUsers className="text-gray-400" />
                            {item.participations_count || 0} / {item.required_rescuers || '?'}
                        </span>
                        {item.reporter?.name && (
                            <span className="flex items-center gap-1">
                                <FaClock className="text-gray-400" />
                                {item.reporter.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const EmergencyCasesHubPage = () => {
    console.log('✅ EmergencyCasesHubPage is rendering!');
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('myReports');
    const [activeFilter, setActiveFilter] = useState('ALL');

    const { myReports, myParticipations, explore, receivedRequests } = useSelector(s => s.emergencyCases);

    const listBySlice = { myReports, myParticipations, explore, receivedRequests };
    const config = TAB_CONFIG[activeTab];
    const listState = listBySlice[config.sliceKey] || { data: [], meta: {}, loading: false, error: null };

    const fetchList = useCallback((page = 1) => {
        const filter = SUB_FILTERS.find(f => f.key === activeFilter) || SUB_FILTERS[0];
        dispatch(config.thunk({ perPage: 15, page, ...filter.params }));
    }, [dispatch, activeTab, activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchList(1);
    }, [activeTab, activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setActiveFilter('ALL'); // ✅ نصفّر الفلتر الفرعي عند تبديل التبويب الرئيسي
    };

    const handleCardClick = (item) => {
        navigate(`/emergency/${config.route}/${item.id}`);
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-3xl">
            <Heading title={t('emergency.rescueRequests') || 'حالات الطوارئ'} subtitle={t('emergency.caseDetails')} />

            {/* ── التبويبات الرئيسية ── */}
            <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${activeTab === tab.key
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        {t(tab.labelKey)}
                    </button>
                ))}
            </div>

            {/* ── الفلاتر الفرعية (Chips) ── */}
            <div className="flex flex-wrap gap-2 mb-6">
                {SUB_FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setActiveFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === f.key
                            ? 'bg-primary text-white shadow-md shadow-primary/25'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {t(f.labelKey)}
                    </button>
                ))}
                <span className="text-xs text-gray-400 mr-auto self-center">
                    {listState.meta?.total ?? 0}
                </span>
            </div>

            {/* ── المحتوى ── */}
            {listState.loading && listState.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">{t('common.loading')}</p>
                </div>
            ) : listState.error ? (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-600 p-4 rounded-xl mb-4">
                    {listState.error}
                </div>
            ) : listState.data.length === 0 ? (
                <div className="text-center py-20 animate-fade-up">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <FaExclamationTriangle className="text-3xl text-gray-300" />
                    </div>
                    <p className="text-gray-400">{t(config.emptyKey)}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {listState.data.map(item => (
                        <CaseCard key={item.id} item={item} t={t} onClick={() => handleCardClick(item)} />
                    ))}
                </div>
            )}

            {/* ── Pagination ── */}
            {listState.meta && listState.meta.last_page > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        disabled={listState.meta.current_page <= 1}
                        onClick={() => fetchList(listState.meta.current_page - 1)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                        {t('common.previous')}
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                        {listState.meta.current_page} / {listState.meta.last_page}
                    </span>
                    <button
                        disabled={listState.meta.current_page >= listState.meta.last_page}
                        onClick={() => fetchList(listState.meta.current_page + 1)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                        {t('common.next')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmergencyCasesHubPage;