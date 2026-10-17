import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  fetchUserNotifications,
  markNotificationReadThunk,
} from '../redux/slices/rescueRequestsSlice';
import { showSuccess } from '../utils/toastHelpers';
import Heading from '../components/Shared/Heading';
import {
  FaBell, FaArrowRight, FaSync, FaCheckCircle, FaTimesCircle,
  FaExclamationTriangle, FaClock, FaCheckDouble, FaCalendarPlus,
} from 'react-icons/fa';
import { formatDate } from '../utils/dateHelpers';

const NotifCard = ({ notif, t, onMarkRead }) => {
  const navigate = useNavigate();
  const isRead = notif.is_read;
  const type = notif.type || 'general';

  const iconMap = {
    sos_emergency: <FaExclamationTriangle className="text-red-500 text-xl" />,
    trust_verification_approved: <FaCheckCircle className="text-green-500 text-xl" />,
    trust_verification_rejected: <FaTimesCircle className="text-red-500 text-xl" />,
    service_booking_received: <FaClock className="text-yellow-500 text-xl" />,
    service_booking_approved: <FaCheckCircle className="text-green-500 text-xl" />,
    service_booking_rejected: <FaTimesCircle className="text-red-500 text-xl" />,
    service_booking_completed: <FaCheckDouble className="text-blue-500 text-xl" />,
    service_request_approved: <FaCheckCircle className="text-green-500 text-xl" />,
    service_request_rejected: <FaTimesCircle className="text-red-500 text-xl" />,
  };
  const icon = iconMap[type] || <FaBell className="text-gray-400 text-xl" />;

  const handleClick = async () => {
    if (!isRead) {
      await onMarkRead(notif.id);
    }
    const path = notif.navigation?.web_path || '/notifications';
    navigate(path);
  };

  return (
    <div
      onClick={handleClick}
      className={`rounded-2xl p-4 border transition-all duration-200 cursor-pointer hover:shadow-xl hover:scale-[1.01] ${
        isRead
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      } animate-fade-up`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0 mt-1">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-gray-800 dark:text-white text-sm">
              {notif.title || t('notifications.unknown')}
            </h4>
            <span className="text-xs text-gray-400">{formatDate(notif.created_at)}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {notif.body || notif.message || ''}
          </p>
          {notif.navigation?.emergency_id && (
            <p className="text-xs text-gray-400 mt-1">
              {t('emergency.id')}: {notif.navigation.emergency_id}
            </p>
          )}
          {!isRead && (
            <span className="inline-block mt-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
              {t('notifications.unread')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationsPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userNotifications, unreadCount, loading } = useSelector(
    (state) => state.rescueRequests || { userNotifications: [], unreadCount: 0, loading: false }
  );
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(async (pageNum = 1, append = false) => {
    const result = await dispatch(fetchUserNotifications({ perPage: 20, page: pageNum }));
    if (result.payload && result.payload.length < 20) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchData(1, false);
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(1, false);
    setRefreshing(false);
    showSuccess(t('common.refreshSuccess'));
  };

  const handleMarkRead = async (id) => {
    await dispatch(markNotificationReadThunk(id)).unwrap();
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage, true);
  };

  if (loading && userNotifications.length === 0) {
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
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
        >
          <FaArrowRight /> {t('common.back')}
        </button>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <span className="text-xs bg-primary text-white px-3 py-1 rounded-full inline-flex items-center justify-center leading-none">
              {unreadCount} {t('notifications.unread')}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50"
          >
            <FaSync className={`${refreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      <Heading title={t('notifications.title')} subtitle={t('notifications.subtitle')} />

      {userNotifications.length === 0 ? (
        <div className="text-center py-20 animate-fade-up">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FaBell className="text-3xl text-gray-300" />
          </div>
          <p className="text-gray-400">{t('notifications.noNotifications')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userNotifications.map((notif) => (
            <NotifCard
              key={notif.id}
              notif={notif}
              t={t}
              onMarkRead={handleMarkRead}
            />
          ))}
          {hasMore && (
            <button
              onClick={loadMore}
              className="w-full py-2 text-sm text-primary hover:underline hover:text-primary/80 transition-colors"
            >
              {t('common.loadMore')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;