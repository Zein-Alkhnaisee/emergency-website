// src/pages/NotificationsPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllNotifications,
  markRead,
} from '../redux/slices/notificationsSlice';
import { showSuccess, showError } from '../utils/toastHelpers';
import Heading from '../components/Shared/Heading';
import {
  FaCheck, FaTimes, FaMapMarkerAlt, FaArrowRight, FaBell,
  FaFire, FaCar, FaHeartbeat, FaExclamationTriangle,
  FaStar, FaCalendarCheck, FaClock,
} from 'react-icons/fa';

// ── أيقونات حسب نوع الإشعار ────────────────────────────────────
const TYPE_ICONS = {
  emergency: { icon: <FaExclamationTriangle className="text-red-500" />, bg: 'bg-red-50 dark:bg-red-950/20' },
  service_booking_received: { icon: <FaClock className="text-yellow-500" />, bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
  service_booking_approved: { icon: <FaCheck className="text-green-500" />, bg: 'bg-green-50 dark:bg-green-950/20' },
  service_booking_rejected: { icon: <FaTimes className="text-red-500" />, bg: 'bg-red-50 dark:bg-red-950/20' },
  service_booking_completed: { icon: <FaCheck className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-950/20' },
  service_request_approved: { icon: <FaCheck className="text-green-500" />, bg: 'bg-green-50 dark:bg-green-950/20' },
  service_request_rejected: { icon: <FaTimes className="text-red-500" />, bg: 'bg-red-50 dark:bg-red-950/20' },
  rating: { icon: <FaStar className="text-yellow-400" />, bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
};

const TYPE_LABELS = (t) => ({
  emergency: t('notifications.emergency'),
  service_booking_received: t('notifications.serviceBookingReceived'),
  service_booking_approved: t('notifications.serviceBookingApproved'),
  service_booking_rejected: t('notifications.serviceBookingRejected'),
  service_booking_completed: t('notifications.serviceBookingCompleted'),
  service_request_approved: t('notifications.serviceRequestApproved'),
  service_request_rejected: t('notifications.serviceRequestRejected'),
  rating: t('notifications.rating'),
});

const NotifCard = ({ notif, t, onMarkRead }) => {
  const type = notif.type || 'emergency';
  const iconData = TYPE_ICONS[type] || TYPE_ICONS.emergency;
  const label = TYPE_LABELS(t)[type] || t('notifications.unknown');
  const isRead = !!notif.read_at;

  const handleClick = () => {
    if (!isRead) onMarkRead(notif.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`rounded-2xl p-5 border transition-all duration-200 ${
        isRead ? 'opacity-60' : 'hover:shadow-md cursor-pointer'
      } ${iconData.bg} border-gray-200 dark:border-gray-700`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{iconData.icon}</span>
        <div className="flex-1">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <h4 className="font-bold text-gray-800 dark:text-white">{label}</h4>
            <span className="text-xs text-gray-400">
              {new Date(notif.created_at).toLocaleString('ar-EG', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {notif.message || notif.body || notif.content || t('notifications.noMessage')}
          </p>
          {notif.data?.rejection_reason && (
            <p className="text-sm text-red-500 mt-1">
              {t('notifications.rejectionReason')}: {notif.data.rejection_reason}
            </p>
          )}
          {notif.emergency?.location_lat && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <FaMapMarkerAlt className="text-primary shrink-0" />
              {notif.emergency.location_lat?.toFixed(4)}, {notif.emergency.location_lng?.toFixed(4)}
            </p>
          )}
        </div>
        {!isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
      </div>
    </div>
  );
};

const NotificationsPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading, error, unreadCount } = useSelector(s => s.notifications || { list: [], unreadCount: 0 });

  useEffect(() => {
    dispatch(fetchAllNotifications());
  }, [dispatch]);

  const handleMarkRead = (id) => {
    dispatch(markRead(id));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">{t('common.loading')}</p>
    </div>
  );

  if (error) return (
    <div className="container mx-auto p-4 max-w-3xl text-center py-20">
      <p className="text-red-500">{error}</p>
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex justify-between items-center mb-5">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 transition"
        >
          <FaArrowRight /> {t('common.back')}
        </button>
        {unreadCount > 0 && (
          <span className="text-xs bg-primary text-white px-3 py-1 rounded-full">
            {unreadCount} {t('notifications.unread')}
          </span>
        )}
      </div>

      <Heading title={t('notifications.title')} subtitle={t('notifications.subtitle')} />

      {list.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FaBell className="text-3xl text-gray-300" />
          </div>
          <p className="text-gray-400">{t('notifications.noNotifications')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(notif => (
            <NotifCard
              key={notif.id}
              notif={notif}
              t={t}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;