// src/pages/RescueRequestDetailPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchRescueRequestDetail,
  clearDetail,
  rejectRescueRequest,
} from '../redux/slices/rescueRequestsSlice';
import {
  acceptRescueWithTracking,
  clearTracking,
  setParticipationResolved,
} from '../redux/slices/trackingSlice';
import { resolveMyCase, fetchMyActiveStatus } from '../redux/slices/emergencyCasesSlice'; // ✅ تم إزالة clearActiveStatus
import { showSuccess, showError, confirmToast } from '../utils/toastHelpers';
import TrackingMap from '../components/Tracking/TrackingMap';
import RescuerTracker from '../components/Tracking/RescuerTracker';
import ReportModal from '../components/Reports/ReportModal';
import {
  FaFire, FaCar, FaHeartbeat, FaExclamationTriangle,
  FaMapMarkerAlt, FaArrowRight, FaUser, FaUsers,
  FaCheckCircle, FaTimesCircle, FaClock, FaHourglassHalf,
  FaCheck, FaTimes, FaStopCircle, FaDotCircle,
  FaFlag,
} from 'react-icons/fa';
import { formatEmergencyDate } from '../utils/dateHelpers';

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
  new: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed_quota: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
  resolved: 'text-gray-600 bg-gray-50 dark:bg-gray-700',
  closed: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
  false: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
};

const RescueRequestDetailPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const emergencyId = parseInt(id);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const { gpsLocation } = useSelector(state => state.emergencyGroups || {});
  const { currentUser } = useSelector(state => state.user);

  const { detail, loading, actionLoading, error } = useSelector(s => s.rescueRequests || {});
  const { isAuthenticated } = useSelector(s => s.user);
  const { activeStatus } = useSelector(s => s.emergencyCases || {});
  const [actionInProgress, setActionInProgress] = useState(false);

  const reporterId = detail?.reporter?.id ? Number(detail.reporter.id) : null;
  console.log('🔍 detail object:', detail);
  const isParticipant = !!detail?.my_participation;
  // استخراج المشاركين من الـ detail
  const participations = detail?.participations || detail?.participants || detail?.rescuer_participations || detail?.members || [];

  // ✅ تحديد مسار التوجيه بناءً على دور المستخدم في الحالة النشطة
  const getActiveCasePath = () => {
    if (!activeStatus?.has_active_emergency) return '/my-case';
    if (activeStatus.active_role === 'CREATOR') {
      return '/my-case';
    } else if (activeStatus.active_role === 'PARTICIPANT') {
      return `/emergency/cases/${activeStatus.active_emergency_id}`;
    }
    return '/my-case';
  };

  useEffect(() => {
    if (emergencyId) {
      dispatch(fetchRescueRequestDetail(emergencyId));
      dispatch(fetchMyActiveStatus());
    }
    return () => {
      dispatch(clearDetail());
      dispatch(clearTracking());
      // ✅ لا نمسح activeStatus لأنها state عامة يستخدمها LiveNotificationCenter
    };
  }, [dispatch, emergencyId]);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy_m: pos.coords.accuracy || 10,
            recorded_at: new Date().toISOString(),
          });
        },
        (err) => {
          console.warn('Geolocation error:', err);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    });
  }, []);

  const handleAccept = async () => {
    if (!detail || !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (activeStatus?.has_active_emergency) {
      const role = activeStatus.active_role;
      const msg = role === 'CREATOR'
        ? 'لديك حالة طوارئ نشطة كمُبلّغ. يرجى إنهاؤها أولاً.'
        : 'لديك مشاركة نشطة في حالة طوارئ أخرى. يرجى إنهاؤها أولاً.';
      confirmToast(
        `${msg} هل تريد الذهاب إلى حالتك النشطة؟`,
        () => navigate(getActiveCasePath()),
        'اذهب إلى حالتي',
        'إلغاء'
      );
      return;
    }

    let originData = null;
    const pos = await getCurrentPosition();
    if (pos) {
      originData = pos;
    } else {
      console.warn('Could not get location, accepting without origin');
    }

    setActionInProgress(true);
    try {
      const result = await dispatch(acceptRescueWithTracking({
        emergencyId: detail.id,
        originData,
      })).unwrap();
      showSuccess(t('emergency.acceptSuccess'));
      dispatch(fetchRescueRequestDetail(detail.id));
      dispatch(fetchMyActiveStatus());
    } catch (err) {
      console.error('❌ Accept error:', err);
      if (typeof err === 'string' && err.includes('active emergency')) {
        showError('لا يمكنك قبول حالة جديدة لأن لديك حالة طوارئ نشطة. يرجى إنهاؤها أولاً.');
        navigate(getActiveCasePath());
      } else {
        showError(err || t('emergency.acceptError'));
      }
    } finally {
      setActionInProgress(false);
    }
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

  const handleResolveParticipation = async () => {
    if (!detail) return;
    confirmToast(t('emergency.confirmResolveParticipation'), async () => {
      setActionInProgress(true);
      try {
        await dispatch(resolveMyCase(detail.id)).unwrap();
        showSuccess(t('emergency.participationResolvedSuccess'));
        dispatch(setParticipationResolved());
        dispatch(fetchRescueRequestDetail(detail.id));
        dispatch(fetchMyActiveStatus());
      } catch (err) {
        showError(err || t('emergency.participationResolveError'));
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
          className="mt-4 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  if (!detail) return null;

  const {
    id: emergencyIdNum,
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
  const isParticipantActive = my_participation && !my_participation.is_resolved_by_user;

  const destLocation = location_lat && location_lng
    ? { lat: parseFloat(location_lat), lng: parseFloat(location_lng) }
    : null;

  // ✅ مسار زر "عرض حالتي"
  const activeCasePath = getActiveCasePath();

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
      >
        <FaArrowRight /> {t('common.back')}
      </button>

      {activeStatus?.has_active_emergency && (
        <div className="mt-4 mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center justify-between flex-wrap gap-3 animate-fade-up">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {activeStatus.active_role === 'CREATOR'
                  ? 'لديك حالة طوارئ نشطة كمُبلّغ'
                  : 'لديك مشاركة نشطة في حالة طوارئ أخرى'}
              </p>
              <p className="text-xs text-amber-500 dark:text-amber-400">
                {t('emergency.activeCaseId')}: #{activeStatus.active_emergency_id}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(activeCasePath)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
          >
            {t('emergency.viewMyCase')}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-shadow duration-300 hover:shadow-xl animate-fade-up">
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
              <span className="text-sm text-gray-400">{formatEmergencyDate(created_at)}</span>
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

        {/* خريطة التتبع */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FaDotCircle className="text-primary animate-pulse" />
            {t('emergency.trackingMap') || 'تتبع المنقذين'}
          </h2>
          <TrackingMap
            emergencyId={emergencyIdNum}
            reporterId={reporterId}
            isParticipant={true}
            emergencyLocation={destLocation}
            userGpsLocation={gpsLocation}
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-6">

          {isPending && !activeStatus?.has_active_emergency && (
            <>
              <button
                onClick={handleAccept}
                disabled={actionInProgress || actionLoading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-green-500/30 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
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
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
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
            </>
          )}

          {isParticipantActive && (
            <button
              onClick={handleResolveParticipation}
              disabled={actionInProgress || actionLoading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionInProgress ? (
                t('common.loading')
              ) : (
                <>
                  <FaStopCircle className="text-white" />
                  {t('emergency.endParticipation')}
                </>
              )}
            </button>
          )}
          {/* ── قائمة المشاركين مع زر إبلاغ ── */}
          {participations.length > 0 && detail?.reporter?.id === currentUser?.id && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <FaUsers className="text-primary" />
                {t('emergency.participants') || 'المشاركون'}
              </h3>
              <div className="space-y-2">
                {participations
                  .filter(p => p.user_id !== currentUser?.id) // استثناء نفسي
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{p.user?.name || 'منقذ'}</span>
                        {p.is_resolved_by_user && (
                          <span className="text-xs text-green-600 dark:text-green-400">(أنهى مشاركته)</span>
                        )}
                      </div>
                      {/* ✅ زر إبلاغ عن المشاركة الكاذبة */}
                      {!p.is_resolved_by_user && (
                        <button
                          onClick={() => {
                            setReportTarget({
                              reportedId: p.user_id,
                              reportedName: p.user?.name || 'منقذ',
                              rescueParticipationId: p.id,
                            });
                            setShowReportModal(true);
                          }}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <FaFlag className="text-[10px]" />
                          {t('reports.report')}
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {isParticipantActive && (
            <button
              onClick={() => setShowReportModal(true)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <FaFlag className="text-sm" />
              {t('reports.reportFakeRescue')}
            </button>
          )}
        </div>

        {responded && (
          <div className={`p-4 rounded-xl mb-4 ${response === 'accepted'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
            <p className={`flex items-center gap-2 font-medium ${response === 'accepted' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
              {response === 'accepted' ? <FaCheckCircle /> : <FaTimesCircle />}
              {response === 'accepted' ? t('emergency.youAccepted') : t('emergency.youRejected')}
            </p>
            {notification?.responded_at && (
              <p className="text-xs text-gray-400 mt-1">
                {formatEmergencyDate(notification.responded_at)}
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

      {isParticipantActive && (
        <RescuerTracker
          emergencyId={emergencyIdNum}
          isActiveParticipant={isParticipantActive}
          onOriginRecorded={(origin) => console.log('Origin recorded:', origin)}
          onPingSent={(ping) => console.log('Ping sent:', ping)}
        />
      )}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportTarget(null);
        }}
        reportedId={reportTarget?.reportedId || detail?.reporter?.id}
        reportedName={reportTarget?.reportedName || detail?.reporter?.name || t('emergency.unknown')}
        rescueParticipationId={reportTarget?.rescueParticipationId || detail?.my_participation?.id}
        emergencyId={detail?.id}
      />
    </div>
  );
};

export default RescueRequestDetailPage;