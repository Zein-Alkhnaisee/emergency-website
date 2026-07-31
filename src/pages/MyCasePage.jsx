import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  fetchMyActiveCase,
  resolveMyCase,
  clearMyCase,
} from '../redux/slices/emergencyCasesSlice';
import { showSuccess, showError, confirmToast } from '../utils/toastHelpers';
import Heading from '../components/Shared/Heading';
import Button from '../components/Shared/Button';
import {
  FaArrowRight, FaCheckCircle, FaClock,
  FaMapMarkerAlt, FaFire, FaCar, FaHeartbeat,
  FaUsers, FaExclamationTriangle,
} from 'react-icons/fa';

// ── Helpers ────────────────────────────────────────────────────
const CASE_TYPE_MAP = (t) => ({
  fire: { label: t('emergency.fire'), icon: <FaFire className="text-red-500" />, bg: 'bg-red-50 dark:bg-red-900/20' },
  accident: { label: t('emergency.accident'), icon: <FaCar className="text-orange-500" />, bg: 'bg-orange-50 dark:bg-orange-900/20' },
  medical: { label: t('emergency.medical'), icon: <FaHeartbeat className="text-pink-500" />, bg: 'bg-pink-50 dark:bg-pink-900/20' },
  other: { label: t('emergency.other'), icon: <FaExclamationTriangle className="text-yellow-500" />, bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
});

const SEVERITY_MAP = (t) => ({
  low: { label: t('emergency.low'), color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  medium: { label: t('emergency.medium'), color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  high: { label: t('emergency.high'), color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
});

const STATUS_MAP = (t) => ({
  new: { label: t('emergency.statusNew'), color: 'text-blue-600 bg-blue-100' },
  in_progress: { label: t('emergency.statusInProgress'), color: 'text-amber-600 bg-amber-100' },
  completed_quota: { label: t('emergency.statusCompletedQuota'), color: 'text-green-600 bg-green-100' },
  resolved: { label: t('emergency.statusResolved'), color: 'text-gray-500 bg-gray-100' },
  closed: { label: t('emergency.statusClosed'), color: 'text-gray-500 bg-gray-100' },
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

  useEffect(() => {
    dispatch(fetchMyActiveCase());
    return () => { dispatch(clearMyCase()); };
  }, [dispatch]);

  const handleResolve = () => {
    confirmToast(t('emergency.confirmResolve'), async () => {
      const result = await dispatch(resolveMyCase());
      if (resolveMyCase.fulfilled.match(result)) {
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
      </div>
    );
  }

  if (!myCase) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl">
            ✅
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

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Heading title={t('emergency.myActiveCase')} subtitle={t('emergency.caseDetails')} />
        <button
          onClick={() => navigate('/#emergency')}
          className="flex items-center gap-2 text-primary text-sm hover:underline"
        >
          <FaArrowRight /> {t('emergency.backToEmergency')}
        </button>
      </div>

      <div className={`${caseType.bg} rounded-2xl p-5 mb-5 flex items-center gap-4`}>
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

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-5">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 mb-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('emergency.progress')}</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-end">
            {myCase.participations_count || 0} / {myCase.required_rescuers} {t('emergency.rescuers')}
          </p>
        </div>
      )}

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