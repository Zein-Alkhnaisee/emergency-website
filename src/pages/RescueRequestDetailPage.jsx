// src/pages/RescueRequestDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchRescueRequestDetail,
  acceptRescueRequest,
  rejectRescueRequest,
  clearDetail,
} from '../redux/slices/rescueRequestsSlice';
import { showSuccess, showError, confirmToast } from '../utils/toastHelpers';
import Heading from '../components/Shared/Heading';
import {
  FaFire, FaCar, FaHeartbeat, FaExclamationTriangle,
  FaMapMarkerAlt, FaArrowRight, FaUser, FaUsers,
  FaCheckCircle, FaTimesCircle, FaClock, FaHourglassHalf,
  FaCheck, FaTimes, // ✅ الأيقونات الجديدة للأزرار
} from 'react-icons/fa';

const CASE_ICON = {
  fire: <FaFire className="text-red-500 text-4xl" />,
  accident: <FaCar className="text-orange-500 text-4xl" />,
  medical: <FaHeartbeat className="text-pink-500 text-4xl" />,
  other: <FaExclamationTriangle className="text-yellow-500 text-4xl" />,
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
const SEVERITY_COLOR = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-red-500',
  critical: 'text-red-700',
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
  new: 'text-blue-600 bg-blue-50',
  in_progress: 'text-yellow-600 bg-yellow-50',
  completed_quota: 'text-green-600 bg-green-50',
  resolved: 'text-gray-600 bg-gray-50',
  closed: 'text-gray-500 bg-gray-100',
  false: 'text-red-600 bg-red-50',
};

// دالة تنسيق التاريخ بدون date-fns
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('ar-EG', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const RescueRequestDetailPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { detail, loading, actionLoading, error } = useSelector(s => s.rescueRequests || {});
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchRescueRequestDetail(parseInt(id)));
    }
    return () => {
      dispatch(clearDetail());
    };
  }, [dispatch, id]);

  const handleAccept = async () => {
    if (!detail) return;
    confirmToast(t('emergency.confirmAccept'), async () => {
      setActionInProgress(true);
      try {
        await dispatch(acceptRescueRequest(detail.id)).unwrap();
        showSuccess(t('emergency.acceptSuccess'));
        dispatch(fetchRescueRequestDetail(detail.id));
      } catch (err) {
        showError(err || t('emergency.acceptError'));
      } finally {
        setActionInProgress(false);
      }
    });
  };

  const handleReject = async () => {
    if (!detail) return;
    confirmToast(t('emergency.confirmReject'), async () => {
      setActionInProgress(true);
      try {
        await dispatch(rejectRescueRequest(detail.id)).unwrap();
        showSuccess(t('emergency.rejectSuccess'));
        dispatch(fetchRescueRequestDetail(detail.id));
      } catch (err) {
        showError(err || t('emergency.rejectError'));
      } finally {
        setActionInProgress(false);
      }
    });
  };

  if (loading && !detail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-3xl text-center py-20">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => navigate('/emergency/rescue-requests')}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-xl"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  if (!detail) return null;

  const {
    id: emergencyId,
    case_type,
    custom_text,
    severity,
    status,
    location_lat,
    location_lng,
    required_rescuers,
    created_at,
    reporter,
    group,
    notification,
    can_respond,
    participations_count,
    my_participation,
    navigation,
  } = detail;

  const isPending = notification?.is_responded === false && can_respond;
  const responded = notification?.is_responded === true;
  const response = notification?.response;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 transition mb-4"
      >
        <FaArrowRight /> {t('common.back')}
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-start gap-4 mb-6">
          <span className="text-5xl">{CASE_ICON[case_type] || CASE_ICON.other}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {CASE_LABEL[case_type] || case_type}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className={`text-sm px-3 py-1 rounded-full ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABEL[status] || status}
              </span>
              <span className={`text-sm ${SEVERITY_COLOR[severity] || 'text-gray-500'}`}>
                {t('emergency.severityLevel')}: {SEVERITY_LABEL[severity] || severity}
              </span>
              <span className="text-sm text-gray-400">{formatDate(created_at)}</span>
            </div>
          </div>
        </div>

        {custom_text && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-gray-700 dark:text-gray-300">{custom_text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <FaMapMarkerAlt className="text-primary" />
            <div>
              <p className="text-xs text-gray-400">{t('emergency.location')}</p>
              <p className="text-sm font-medium">
                {location_lat && location_lng
                  ? `${parseFloat(location_lat).toFixed(5)}, ${parseFloat(location_lng).toFixed(5)}`
                  : t('common.notAvailable')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <FaUsers className="text-primary" />
            <div>
              <p className="text-xs text-gray-400">{t('emergency.group')}</p>
              <p className="text-sm font-medium">{group?.name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <FaUser className="text-primary" />
            <div>
              <p className="text-xs text-gray-400">{t('emergency.reporter')}</p>
              <p className="text-sm font-medium">{reporter?.name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <FaUsers className="text-primary" />
            <div>
              <p className="text-xs text-gray-400">{t('emergency.rescuers')}</p>
              <p className="text-sm font-medium">
                {participations_count || 0} / {required_rescuers || '?'}
              </p>
            </div>
          </div>
        </div>

        {/* ✅ أزرار القبول/الرفض بأيقونات بدلاً من ✅ و ❌ */}
        {isPending && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={handleAccept}
              disabled={actionInProgress || actionLoading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionInProgress ? (
                t('common.loading')
              ) : (
                <>
                  <FaCheck className="text-white" />
                  {t('emergency.accept')}
                </>
              )}
            </button>
            <button
              onClick={handleReject}
              disabled={actionInProgress || actionLoading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionInProgress ? (
                t('common.loading')
              ) : (
                <>
                  <FaTimes className="text-white" />
                  {t('emergency.reject')}
                </>
              )}
            </button>
          </div>
        )}

        {responded && (
          <div className={`p-4 rounded-xl mb-4 ${
            response === 'accepted'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200'
          }`}>
            <p className={`flex items-center gap-2 font-medium ${
              response === 'accepted' ? 'text-green-700' : 'text-red-700'
            }`}>
              {response === 'accepted' ? <FaCheckCircle /> : <FaTimesCircle />}
              {response === 'accepted' ? t('emergency.youAccepted') : t('emergency.youRejected')}
            </p>
            {notification?.responded_at && (
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(notification.responded_at)}
              </p>
            )}
          </div>
        )}

        {!can_respond && !responded && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center text-gray-400">
            <FaClock className="inline mr-2" />
            {t('emergency.cannotRespond')}
          </div>
        )}

        {navigation && (
          <div className="text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
            <p>ID: {navigation.emergency_id}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RescueRequestDetailPage;