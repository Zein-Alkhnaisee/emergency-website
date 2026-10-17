// src/pages/MyCasePage.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  fetchMyActiveCase,
  resolveMyCase,
  clearMyCase,
  fetchMyActiveStatus,   // ✅ إضافة
} from '../redux/slices/emergencyCasesSlice';
import { clearTracking } from '../redux/slices/trackingSlice';
import { showSuccess, showError, confirmToast } from '../utils/toastHelpers';
import Heading from '../components/Shared/Heading';
import Button from '../components/Shared/Button';
import TrackingMap from '../components/Tracking/TrackingMap';
import {
  FaArrowRight, FaCheckCircle, FaClock,
  FaMapMarkerAlt, FaFire, FaCar, FaHeartbeat,
  FaUsers, FaExclamationTriangle,
} from 'react-icons/fa';

// ── Helpers ────────────────────────────────────────────────────
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

// ── Main ───────────────────────────────────────────────────────
const MyCasePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myCase, loading, error, resolving } = useSelector(s => s.emergencyCases);
  const { gpsLocation } = useSelector(state => state.emergencyGroups || {});

  useEffect(() => {
    dispatch(fetchMyActiveCase());
    return () => { dispatch(clearMyCase()); };
  }, [dispatch]);

  const handleResolve = () => {
    confirmToast(t('emergency.confirmResolve'), async () => {
      const result = await dispatch(resolveMyCase());
      if (resolveMyCase.fulfilled.match(result)) {
        dispatch(clearTracking());
        dispatch(fetchMyActiveStatus());   // ✅ إضافة
        showSuccess(t('emergency.resolvedSuccess'));
        dispatch(fetchMyActiveCase());
      } else {
        showError(result.payload);
      }
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">{t('common.loading')}</p>
    </div>
  );

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-3xl text-center py-20">
        <div className="text-5xl mb-4 flex items-center justify-center"><FaExclamationTriangle className="text-xxl" /></div>
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => navigate('/#emergency')}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
        >
          {t('emergency.goToEmergency')}
        </button>
      </div>
    );
  }

  if (!myCase) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="text-center py-20 animate-fade-up">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl text-gray-400">
            <FaExclamationTriangle className="text-5xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {t('emergency.noActiveCase')}
          </h2>
          <p className="text-gray-500 mb-6">{t('emergency.goToEmergencyDesc')}</p>
          <Button
            text={t('emergency.goToEmergency')}
            handler={() => navigate('/#emergency')}
            bgColor="bg-primary"
            textColor="text-white"
          />
        </div>
      </div>
    );
  }

  const caseTypeMap = CASE_TYPE_MAP(t);
  const severityMap = SEVERITY_MAP(t);
  const statusMap = STATUS_MAP(t);
  const caseType = caseTypeMap[myCase.case_type] || caseTypeMap.other;
  const severity = severityMap[myCase.severity] || severityMap.medium;
  const status = statusMap[myCase.status] || statusMap.new;
  const isClosed = myCase.status === 'resolved' || myCase.status === 'closed';
  const progress = myCase.required_rescuers > 0
    ? Math.min(100, Math.round(((myCase.participations_count || 0) / myCase.required_rescuers) * 100))
    : 0;

  const emergencyLocation = myCase.location_lat && myCase.location_lng
    ? { lat: parseFloat(myCase.location_lat), lng: parseFloat(myCase.location_lng) }
    : null;

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Heading title={t('emergency.myActiveCase')} subtitle={t('emergency.caseDetails')} />
        <button
          onClick={() => navigate('/#emergency')}
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
          value={`${parseFloat(myCase.location_lat).toFixed(5)}, ${parseFloat(myCase.location_lng).toFixed(5)}`}
        />
        {myCase.custom_text && (
          <InfoRow label={t('emergency.additionalDetails')} value={myCase.custom_text} />
        )}
        <InfoRow
          label={t('emergency.requiredRescuers')}
          icon={<FaUsers />}
          value={myCase.required_rescuers || '—'}
        />
        <InfoRow
          label={t('emergency.respondedRescuers')}
          icon={<FaCheckCircle />}
          value={`${myCase.participations_count || 0} ${t('emergency.of')} ${myCase.required_rescuers || '?'}`}
        />
      </div>

      {myCase.required_rescuers > 0 && (
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
            {myCase.participations_count || 0} / {myCase.required_rescuers} {t('emergency.rescuers')}
          </p>
        </div>
      )}

      <div className="mb-5">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-3 flex items-center gap-2">
          <FaMapMarkerAlt className="text-primary" />
          {t('emergency.trackingMap') || 'خريطة التتبع'}
        </h3>
        <TrackingMap
          emergencyId={myCase.id}
          reporterId={myCase.reporter?.id || myCase.user_id || null}
          isParticipant={true}
          emergencyLocation={emergencyLocation}
          userGpsLocation={gpsLocation}
        />
      </div>

      {!isClosed && (
        <div className="flex gap-3">
          <Button
            text={resolving ? t('common.loading') : t('emergency.endCase')}
            handler={handleResolve}
            bgColor="bg-red-500 hover:bg-red-600"
            textColor="text-white"
            disabled={resolving}
            icon={<FaCheckCircle className="text-sm" />}
          />
        </div>
      )}
    </div>
  );
};

export default MyCasePage;