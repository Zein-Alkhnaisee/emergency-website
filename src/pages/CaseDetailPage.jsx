// src/pages/CaseDetailPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCaseDetail, resolveCase, clearMyCase, fetchMyActiveStatus } from '../redux/slices/emergencyCasesSlice'; // ✅ إضافة fetchMyActiveStatus
import { clearTracking } from '../redux/slices/trackingSlice';
import { showSuccess, showError, confirmToast } from '../utils/toastHelpers';
import Heading from '../components/Shared/Heading';
import Button from '../components/Shared/Button';
import TrackingMap from '../components/Tracking/TrackingMap';
import {
  FaArrowRight, FaCheckCircle, FaClock,
  FaMapMarkerAlt, FaFire, FaCar, FaHeartbeat,
  FaUsers, FaExclamationTriangle, FaUserCheck,
} from 'react-icons/fa';
import { formatEmergencyDate } from '../utils/dateHelpers';

const CASE_TYPE_MAP = (t) => ({
  fire: { label: t('emergency.fire'), icon: <FaFire className="text-red-500" />, bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
  accident: { label: t('emergency.accident'), icon: <FaCar className="text-orange-500" />, bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
  medical: { label: t('emergency.medical'), icon: <FaHeartbeat className="text-pink-500" />, bg: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800' },
  other: { label: t('emergency.other'), icon: <FaExclamationTriangle className="text-yellow-500" />, bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' },
});

const SEVERITY_MAP = (t) => ({
  low: { label: t('emergency.low'), color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  medium: { label: t('emergency.medium'), color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
  high: { label: t('emergency.high'), color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
});

const STATUS_MAP = (t) => ({
  new: { label: t('emergency.statusNew'), color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  in_progress: { label: t('emergency.statusInProgress'), color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
  completed_quota: { label: t('emergency.statusCompletedQuota'), color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  resolved: { label: t('emergency.statusResolved'), color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
  closed: { label: t('emergency.statusClosed'), color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
  false: { label: t('emergency.statusFalse'), color: 'text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
});

const InfoRow = ({ label, value, icon }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
    {icon && <span className="mt-0.5 text-gray-400 shrink-0">{icon}</span>}
    <div className="flex-1">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  </div>
);

const CaseDetailPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { detail, loading, error, resolving } = useSelector(s => s.emergencyCases);
  const { currentUser } = useSelector(s => s.user);
  const { gpsLocation } = useSelector(state => state.emergencyGroups || {});

  useEffect(() => {
    if (id) {
      dispatch(fetchCaseDetail(parseInt(id)));
    }
    return () => {
      dispatch(clearMyCase());
    };
  }, [dispatch, id]);

  const handleResolve = () => {
    const isCreator = detail?.user_relation?.is_creator || false;
    const confirmMessage = isCreator
      ? t('emergency.confirmResolve')
      : t('emergency.confirmResolveParticipation');

    confirmToast(confirmMessage, async () => {
      try {
        await dispatch(resolveCase(detail.id)).unwrap();
        dispatch(clearTracking());
        dispatch(fetchMyActiveStatus());   // ✅ إضافة
        const successMessage = isCreator
          ? t('emergency.resolvedSuccess')
          : t('emergency.participationResolvedSuccess');
        showSuccess(successMessage);
        dispatch(fetchCaseDetail(detail.id));
      } catch (err) {
        showError(err || t('common.error'));
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
          onClick={() => navigate('/emergency')}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="container mx-auto p-4 max-w-3xl text-center py-20">
        <p className="text-gray-400">{t('common.noData')}</p>
      </div>
    );
  }

  const caseTypeMap = CASE_TYPE_MAP(t);
  const severityMap = SEVERITY_MAP(t);
  const statusMap = STATUS_MAP(t);
  const caseType = caseTypeMap[detail.case_type] || caseTypeMap.other;
  const severity = severityMap[detail.severity] || severityMap.medium;
  const status = statusMap[detail.status] || statusMap.new;
  const isClosed = detail.status === 'resolved' || detail.status === 'closed' || detail.status === 'false';
  const isCreator = detail.user_relation?.is_creator || false;
  const isParticipant = detail.user_relation?.is_participant || false;
  const myParticipation = detail.my_participation || null;
  const hasResolvedParticipation = isParticipant && myParticipation?.is_resolved_by_user === true;

  const canResolve = !isClosed && (isCreator || (isParticipant && !hasResolvedParticipation));

  const resolveButtonText = isCreator
    ? t('emergency.endCase')
    : t('emergency.endParticipation');

  const progress = detail.required_rescuers > 0
    ? Math.min(100, Math.round(((detail.participations_count || 0) / detail.required_rescuers) * 100))
    : 0;

  const emergencyLocation = detail.location_lat && detail.location_lng
    ? { lat: parseFloat(detail.location_lat), lng: parseFloat(detail.location_lng) }
    : null;

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Heading title={t('emergency.caseDetails')} subtitle={`#${detail.id}`} />
        <button
          onClick={() => navigate('/emergency')}
          className="flex items-center gap-2 text-primary text-sm hover:underline hover:text-primary/80 transition-colors"
        >
          <FaArrowRight /> {t('emergency.backToEmergency')}
        </button>
      </div>

      <div className={`${caseType.bg} rounded-2xl p-5 mb-5 flex items-center gap-4 border transition-all duration-200 hover:shadow-md`}>
        <div className="text-3xl">{caseType.icon}</div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('emergency.caseType')}</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">{caseType.label}</p>
        </div>
        <div className="mr-auto flex items-center gap-2">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${severity.color}`}>
            {severity.label}
          </span>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-5 transition-shadow duration-300 hover:shadow-xl">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-4 flex items-center gap-2">
          <FaClock className="text-primary" /> {t('emergency.caseDetails')}
        </h3>

        <InfoRow
          label={t('emergency.location')}
          icon={<FaMapMarkerAlt />}
          value={`${parseFloat(detail.location_lat).toFixed(5)}, ${parseFloat(detail.location_lng).toFixed(5)}`}
        />
        {detail.custom_text && (
          <InfoRow label={t('emergency.additionalDetails')} value={detail.custom_text} />
        )}
        <InfoRow
          label={t('emergency.reporter')}
          icon={<FaUsers />}
          value={detail.reporter?.name || '—'}
        />
        <InfoRow
          label={t('emergency.group')}
          icon={<FaUsers />}
          value={detail.group?.name || '—'}
        />
        <InfoRow
          label={t('emergency.requiredRescuers')}
          icon={<FaUsers />}
          value={detail.required_rescuers || '—'}
        />
        <InfoRow
          label={t('emergency.respondedRescuers')}
          icon={<FaCheckCircle />}
          value={`${detail.participations_count || 0} ${t('emergency.of')} ${detail.required_rescuers || '?'}`}
        />
        {isParticipant && myParticipation && (
          <InfoRow
            label={t('emergency.yourParticipation')}
            icon={<FaUserCheck className="text-primary" />}
            value={hasResolvedParticipation
              ? `${t('emergency.participationResolvedAt')}: ${formatEmergencyDate(myParticipation.resolved_at)}`
              : `${t('emergency.acceptedAt')}: ${formatEmergencyDate(myParticipation.accepted_at)}`
            }
          />
        )}
      </div>

      {detail.required_rescuers > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 mb-5 transition-shadow duration-300 hover:shadow-xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('emergency.progress')}</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-primary-dark to-secondary rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-end">
            {detail.participations_count || 0} / {detail.required_rescuers} {t('emergency.rescuers')}
          </p>
        </div>
      )}

      {(isCreator || isParticipant) && (
        <div className="mb-5">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-3 flex items-center gap-2">
            <FaMapMarkerAlt className="text-primary" />
            {t('emergency.trackingMap') || 'خريطة التتبع'}
          </h3>
          <TrackingMap
            emergencyId={parseInt(id)}
            reporterId={detail.reporter?.id || null}
            isParticipant={isCreator || isParticipant}
            emergencyLocation={emergencyLocation}
            userGpsLocation={gpsLocation}
          />
        </div>
      )}

      {canResolve && (
        <div className="flex gap-3">
          <Button
            text={resolving ? t('common.loading') : resolveButtonText}
            handler={handleResolve}
            bgColor={isCreator ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}
            textColor="text-white"
            disabled={resolving}
            icon={isCreator ? <FaCheckCircle className="text-sm" /> : <FaUserCheck className="text-sm" />}
          />
        </div>
      )}

      {hasResolvedParticipation && !isClosed && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center text-green-700 dark:text-green-400 animate-fade-up">
          <FaCheckCircle className="inline mr-2" />
          {t('emergency.youHaveResolvedParticipation')}
          <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
            {t('emergency.participationResolvedNote')}
          </p>
        </div>
      )}

      {isClosed && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center text-gray-500 animate-fade-up">
          <FaCheckCircle className="inline text-green-500 mr-2" />
          {detail.status === 'resolved' && t('emergency.statusResolved')}
          {detail.status === 'closed' && t('emergency.statusClosed')}
          {detail.status === 'false' && t('emergency.statusFalse')}
        </div>
      )}
    </div>
  );
};

export default CaseDetailPage;