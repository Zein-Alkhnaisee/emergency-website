// src/pages/RescueRequestsPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { fetchRescueRequests } from '../redux/slices/rescueRequestsSlice';
import Heading from '../components/Shared/Heading';
import {
  FaFire, FaCar, FaHeartbeat, FaExclamationTriangle,
  FaMapMarkerAlt, FaArrowRight, FaBell, FaClock,
  FaCheckCircle, FaTimesCircle, FaHourglassHalf,
  FaDotCircle,
} from 'react-icons/fa';
import { formatDate } from '../utils/dateHelpers';

const CASE_ICON = {
  fire: <FaFire className="text-red-500" />,
  accident: <FaCar className="text-orange-500" />,
  medical: <FaHeartbeat className="text-pink-500" />,
  other: <FaExclamationTriangle className="text-yellow-500" />,
};
const CASE_LABEL = {
  fire: 'حريق',
  accident: 'حادث',
  medical: 'حالة طبية',
  other: 'طوارئ',
};
const SEVERITY_LABEL = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  critical: 'حرجة',
};
const STATUS_LABEL = {
  new: 'جديدة',
  in_progress: 'قيد الاستجابة',
  completed_quota: 'اكتمل الطاقم',
  resolved: 'منتهية',
  closed: 'مغلقة',
  false: 'ملغية',
};
const STATUS_COLOR = {
  new: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed_quota: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
  resolved: 'text-gray-600 bg-gray-50 dark:bg-gray-700',
  closed: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
  false: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
};

const RescueRequestCard = ({ request, t }) => {
  const navigate = useNavigate();
  const { id, case_type, severity, status, group, notification, can_respond, my_participation } = request;
  const isPending = !notification?.is_responded && can_respond;
  const isParticipantActive = my_participation && !my_participation.is_resolved_by_user;

  const handleClick = () => {
    navigate(`/emergency/rescue-requests/${id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`rounded-2xl p-5 border transition-all duration-200 cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-[1.01] ${
        isPending ? 'border-r-4 border-r-primary' : ''
      } animate-fade-up`}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl shrink-0">{CASE_ICON[case_type] || CASE_ICON.other}</span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <h4 className="font-bold text-gray-800 dark:text-white text-base">
              {CASE_LABEL[case_type] || case_type}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABEL[status] || status}
              </span>
              <span className="text-xs text-gray-400">{formatDate(request.created_at)}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {request.custom_text || t('emergency.helpNeeded')}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span className="flex items-center gap-1">
              <FaMapMarkerAlt className="text-primary" />
              {group?.name || 'غروب'}
            </span>
            <span className="flex items-center gap-1">
              <FaClock className="text-gray-400" />
              {t('emergency.severityLevel')}: {SEVERITY_LABEL[severity] || severity}
            </span>
            {notification?.is_responded && (
              <span className={`flex items-center gap-1 ${
                notification.response === 'accepted' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {notification.response === 'accepted' ? <FaCheckCircle /> : <FaTimesCircle />}
                {notification.response === 'accepted' ? t('emergency.accepted') : t('emergency.rejected')}
              </span>
            )}
            {!notification?.is_responded && can_respond && (
              <span className="flex items-center gap-1 text-primary font-medium">
                <FaHourglassHalf />
                {t('emergency.pendingResponse')}
              </span>
            )}
            {!can_respond && !notification?.is_responded && (
              <span className="text-gray-400 text-xs">{t('emergency.cannotRespond')}</span>
            )}
            {isParticipantActive && (
              <span className="flex items-center gap-1 text-blue-500 text-xs font-medium">
                <FaDotCircle className="animate-pulse" />
                {t('emergency.trackingActive') || 'تتبع نشط'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RescueRequestsPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, meta, loading, error } = useSelector(s => s.rescueRequests || { list: [], meta: {} });

  // وضع الفلتر: 'pending' | 'active' | 'all'
  const [filterMode, setFilterMode] = useState('pending');
  const [refreshKey, setRefreshKey] = useState(0);

  // جلب البيانات عند تغيير الفلتر أو التحديث
  useEffect(() => {
    const params = { perPage: 20 };
    if (filterMode === 'pending') {
      params.pending = true;
      params.active = false;
    } else if (filterMode === 'active') {
      params.pending = false;
      params.active = true;
    }
    // إذا كان 'all'، لا نرسل pending ولا active → يجلب كل شيء
    dispatch(fetchRescueRequests(params));
  }, [dispatch, filterMode, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading && list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
        >
          <FaArrowRight /> {t('common.back')}
        </button>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
        >
          <FaBell className="text-sm" />
          {t('common.refresh')}
        </button>
      </div>

      <Heading title={t('emergency.rescueRequests')} subtitle={t('emergency.rescueRequestsSubtitle')} />

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
        <button
          onClick={() => setFilterMode('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filterMode === 'pending'
              ? 'bg-primary text-white shadow-md shadow-primary/25'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {t('emergency.pendingOnly')}
        </button>
        <button
          onClick={() => setFilterMode('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filterMode === 'active'
              ? 'bg-primary text-white shadow-md shadow-primary/25'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {t('emergency.activeOnly')}
        </button>
        <button
          onClick={() => setFilterMode('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filterMode === 'all'
              ? 'bg-primary text-white shadow-md shadow-primary/25'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {t('common.all') || 'الكل'}
        </button>
        <span className="text-sm text-gray-400 mr-auto">
          {t('emergency.totalRequests', { count: meta.total || 0 })}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 p-4 rounded-xl mb-4 animate-fade-up">
          {error}
        </div>
      )}

      {list.length === 0 ? (
        <div className="text-center py-20 animate-fade-up">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FaBell className="text-3xl text-gray-300" />
          </div>
          <p className="text-gray-400">{t('emergency.noRescueRequests')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(request => (
            <RescueRequestCard key={request.id} request={request} t={t} />
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={meta.current_page <= 1}
            onClick={() => {
              const params = { perPage: 20, page: meta.current_page - 1 };
              if (filterMode === 'pending') { params.pending = true; params.active = false; }
              else if (filterMode === 'active') { params.pending = false; params.active = true; }
              dispatch(fetchRescueRequests(params));
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
          >
            {t('common.previous')}
          </button>
          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
            {meta.current_page} / {meta.last_page}
          </span>
          <button
            disabled={meta.current_page >= meta.last_page}
            onClick={() => {
              const params = { perPage: 20, page: meta.current_page + 1 };
              if (filterMode === 'pending') { params.pending = true; params.active = false; }
              else if (filterMode === 'active') { params.pending = false; params.active = true; }
              dispatch(fetchRescueRequests(params));
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
};

export default RescueRequestsPage;