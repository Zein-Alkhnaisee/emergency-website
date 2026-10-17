// src/pages/EmergencyPage.jsx
import React, { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaExclamationTriangle, FaComments, FaClipboardList, FaHome, FaSearch,
  FaTimes, FaMapPin, FaHandsHelping, FaSync,
  FaList
} from 'react-icons/fa';
import { FaCheck, FaHourglassEnd, FaMagnifyingGlass, FaPeriscope, FaBullhorn, FaUsers } from 'react-icons/fa6';
import {
  searchGroups, confirmOfficialJoin, confirmPendingJoin,
  confirmCreateNewPending, saveHomeLocation,
  fetchMyGroup, clearSearchResult, clearCurrentGroup,
  setGpsLocation as setGpsLocationRedux,   // ✅ إضافة مع alias
} from '../redux/slices/emergencyGroupsSlice';
import { sendSOS } from '../redux/slices/emergencySosSlice';
import { setGroups } from '../redux/slices/geoGroupsSlice';
import { useGeocoder } from '../hooks/useGeocoder';
import { useGeoGroup } from '../hooks/useGeoGroup';
import Button from '../components/Shared/Button';
import Heading from '../components/Shared/Heading';
import { showSuccess, showError, confirmToast } from '../utils/toastHelpers';
import { fetchRescueRequests } from '../redux/slices/rescueRequestsSlice';
import { fetchMyActiveStatus, clearActiveStatus } from '../redux/slices/emergencyCasesSlice';
import AvailabilityToggle from '../components/Emergency/AvailabilityToggle';

// ✅ Lazy load map component
const LazyMap = lazy(() => import('../components/Emergency/MapWithGroups'));

// ── Group selector modal ───────────────────────────────────────
const SelectGroupModal = ({ isOpen, onClose, groups, onSelect, title }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/10 dark:border-gray-700/50 animate-slide-in-up" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => { onSelect(group); onClose(); }}
              className="w-full text-right p-3 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md"
            >
              <p className="font-semibold">{group.name}</p>
              <p className="text-xs text-gray-400">ID: {group.id}</p>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition">
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
};

// ── SOS modal ──────────────────────────────────────────────────
const SOSModal = ({ isOpen, onClose, onSend, loading, t }) => {
  const [emergencyType, setEmergencyType] = useState('');
  const [severity, setSeverity] = useState('high');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    onSend({ emergencyType, severity, message });
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-white/10 dark:border-gray-700/50 animate-slide-in-up"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-5">{t('emergency.reportEmergency')}</h3>

        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('emergency.selectEmergencyType')}</label>
        <select
          value={emergencyType}
          onChange={e => setEmergencyType(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
        >
          <option value="">{t('emergency.selectType')}</option>
          <option value="fire">{t('emergency.fire')}</option>
          <option value="accident">{t('emergency.accident')}</option>
          <option value="medical">{t('emergency.medical')}</option>
          <option value="other">{t('emergency.other')}</option>
        </select>

        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('emergency.severityLevel')}</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { value: 'low', label: t('emergency.low'), color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400' },
            { value: 'medium', label: t('emergency.medium'), color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400' },
            { value: 'high', label: t('emergency.high'), color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400' },
          ].map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSeverity(s.value)}
              className={`py-2 rounded-xl border text-xs font-medium transition-all duration-200 ${severity === s.value
                ? `${s.color} ring-2 ring-offset-2 ring-current`
                : 'bg-gray-50 dark:bg-gray-700 text-gray-500 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('emergency.additionalDetails')}</label>
        <textarea
          placeholder={t('emergency.extra')}
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 mb-5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
          rows={3}
        />

        <div className="flex gap-3 justify-end">
          <Button
            text={t('common.cancel')}
            bgColor="bg-gray-100 dark:bg-gray-700"
            textColor="text-gray-700 dark:text-gray-300"
            onClick={onClose}
          />
          <Button
            text={loading ? t('common.loading') : t('emergency.send')}
            bgColor="bg-red-500 hover:bg-red-600"
            textColor="text-white"
            onClick={handleSend}
            disabled={loading || !emergencyType}
          />
        </div>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────
const EmergencyPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const { geocode, loading: geoLoading, error: geoCodeError } = useGeocoder();

  // ── State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchCoords, setSearchCoords] = useState('');
  const [isSearchingCoords, setIsSearchingCoords] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null); // ✅ هذا هو useState setter
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [loadMap, setLoadMap] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [homeSaved, setHomeSaved] = useState(false);
  const [saveAsHome, setSaveAsHome] = useState(false);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [groupSelectorType, setGroupSelectorType] = useState('official');
  const [isLocating, setIsLocating] = useState(true);
  const [isRefreshingGroup, setIsRefreshingGroup] = useState(false);

  const { currentUser } = useSelector(s => s.user);
  const roles = useSelector(s => s.user.roles);
  const isAuthenticated = useSelector(s => s.user.isAuthenticated);
  const { activeEmergencies } = useSelector(s => s.emergency);
  const { currentGroup, searchResult, officialGroupsList, pendingGroupsList, loading: groupLoading, joining, groupError } =
    useSelector(s => s.emergencyGroups);
  const { loading: sosLoading } = useSelector(s => s.emergencySos);
  const { activeStatus } = useSelector(s => s.emergencyCases || {});

  const isTrusted = roles?.includes('trusted') || currentUser?.role === 'trusted';
  const activeLocation = selectedLocation || gpsLocation;

  const userId = currentUser?.id || 'guest';
  const { assignedGroupId, isInWaiting, loading: geoGroupLoading } = useGeoGroup(activeLocation, userId);

  // ── جلب الموقع تلقائياً عند التحميل ──
  // ✅ الإصدار المصحح: تم إضافة dispatch(setGpsLocationRedux(coords)) لتحديث Redux store
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError(t('emergency.geoNotSupported'));
      setIsLocating(false);
      setLoadMap(true);
      return;
    }

    let mounted = true;
    let watchId = null;
    let hasSetLocation = false;

    const handlePosition = (pos) => {
      if (!mounted || hasSetLocation) return;
      const coords = [pos.coords.latitude, pos.coords.longitude];
      const accuracy = pos.coords.accuracy || 0;

      console.log(`📍 الموقع:`, coords, `الدقة: ${accuracy}m`);

      // ✅ تحديث الحالة المحلية و Redux معاً
      setGpsLocation(coords);
      dispatch(setGpsLocationRedux(coords));   // ✅ تحديث الـ Redux store لخرائط التتبع

      setLoadMap(true);
      setIsLocating(false);
      hasSetLocation = true;

      if (watchId) navigator.geolocation.clearWatch(watchId);
    };

    const handleError = (err) => {
      if (!mounted) return;
      console.warn('❌ GPS error:', err);
      if (err.code === 1) {
        setGeoError(t('emergency.geoDenied'));
      } else {
        setGeoError('تعذر الحصول على الموقع. يرجى تحديث الصفحة.');
      }
      setIsLocating(false);
      setLoadMap(true);
    };

    watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });

    const timeoutId = setTimeout(() => {
      if (mounted && !hasSetLocation) {
        setLoadMap(true);
        setIsLocating(false);
        console.log('⏳ انتهى الوقت المحدد، عرض الخريطة بدون موقع');
      }
    }, 5000);

    return () => {
      mounted = false;
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [t, dispatch]); // ✅ أضفنا dispatch إلى التبعيات

  // ── جلب حالة المستخدم النشطة ──
  useEffect(() => {
    if (isAuthenticated && isTrusted) {
      dispatch(fetchMyActiveStatus());
    }
    return () => {
      dispatch(clearActiveStatus());
    };
  }, [isAuthenticated, isTrusted, dispatch]);

  // ── جلب مجموعتي عند التحميل ──
  useEffect(() => {
    if (isAuthenticated && isTrusted) {
      if (!currentGroup) {
        console.log('🔄 جلب الغروب الحالي (تحميل تلقائي)...');
        dispatch(fetchMyGroup());
      }
    } else {
      dispatch(clearCurrentGroup());
    }
  }, [isAuthenticated, isTrusted, dispatch, currentGroup]);

  // ── دالة لتحديث الغروب يدوياً ──
  const handleRefreshGroup = async () => {
    if (!isAuthenticated || !isTrusted) return;
    setIsRefreshingGroup(true);
    try {
      const result = await dispatch(fetchMyGroup()).unwrap();
      console.log('✅ تم تحديث الغروب:', result);
      showSuccess('تم تحديث الغروب بنجاح');
    } catch (err) {
      console.warn('⚠️ فشل تحديث الغروب:', err);
      showError('فشل تحديث الغروب: ' + err);
    } finally {
      setIsRefreshingGroup(false);
    }
  };

  // ── البحث بالاسم ──
  const handleLocationSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingLocation(true);
    const result = await geocode(searchQuery);
    setIsSearchingLocation(false);

    if (result) {
      setSelectedLocation(result.coords);
      showSuccess(`تم الانتقال إلى: ${result.displayName}`);
    } else if (geoCodeError) {
      showError(geoCodeError);
    }
  };

  // ── البحث بالإحداثيات ──
  const handleCoordSearch = (e) => {
    e.preventDefault();
    const trimmed = searchCoords.trim();
    if (!trimmed) {
      showError('الرجاء إدخال الإحداثيات');
      return;
    }

    const parts = trimmed.split(/[,\s;]+/).filter(p => p.length > 0);
    if (parts.length !== 2) {
      showError('الرجاء إدخال إحداثيتين مفصولتين بفاصلة (مثال: 36.254241, 37.184515)');
      return;
    }

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showError('إحداثيات غير صالحة. خط العرض بين -90 و 90، وخط الطول بين -180 و 180.');
      return;
    }

    setSelectedLocation([lat, lng]);
    showSuccess(`تم الانتقال إلى: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  };

  // ── إعادة جلب الموقع من GPS ──
  const handleRefreshGPS = () => {
    setIsLocating(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(t('emergency.geoNotSupported'));
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        const accuracy = pos.coords.accuracy || 0;
        if (accuracy <= 200) {
          setGpsLocation(coords);
          dispatch(setGpsLocationRedux(coords));   // ✅ تحديث Redux
          setSelectedLocation(null);
          setIsLocating(false);
          showSuccess('تم تحديث الموقع بنجاح');
          console.log('📍 GPS refreshed:', coords, `الدقة: ${accuracy}m`);
        } else {
          setTimeout(() => {
            navigator.geolocation.getCurrentPosition(
              (pos2) => {
                const coords2 = [pos2.coords.latitude, pos2.coords.longitude];
                setGpsLocation(coords2);
                dispatch(setGpsLocationRedux(coords2));   // ✅ تحديث Redux
                setSelectedLocation(null);
                setIsLocating(false);
                showSuccess('تم تحديث الموقع بنجاح (محاولة ثانية)');
                console.log('📍 GPS refreshed (retry):', coords2);
              },
              () => {
                setIsLocating(false);
                showError('فشل تحديث الموقع بدقة مقبولة');
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          }, 2000);
        }
      },
      (err) => {
        if (err.code === 1) setGeoError(t('emergency.geoDenied'));
        else setGeoError(t('emergency.geoError'));
        setIsLocating(false);
        showError('فشل تحديث الموقع: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );
  };

  // ── البحث عن الغروبات ──
  const performSearch = useCallback(async (coords, saveHome = false) => {
    if (!isAuthenticated) {
      showError(t('emergency.loginRequired'));
      return;
    }
    if (!isTrusted) {
      showError(t('emergency.trustRequired'));
      return;
    }
    if (!coords) { showError(t('emergency.locationUnavailable')); return; }
    setIsSearching(true);
    const result = await dispatch(searchGroups({ latitude: coords[0], longitude: coords[1], saveAsHome: saveHome }));
    if (searchGroups.fulfilled.match(result)) {
      const allGroups = [...officialGroupsList, ...pendingGroupsList].map(g => ({
        id: g.id,
        center: g.center_lat && g.center_lng ? [g.center_lat, g.center_lng] : g.center,
        name: g.name,
        radius_km: g.radius_km || 5,
      }));
      dispatch(setGroups(allGroups));
    } else {
      showError(result.payload || t('emergency.searchFailed'));
    }
    setIsSearching(false);
  }, [dispatch, isAuthenticated, isTrusted, t, officialGroupsList, pendingGroupsList]);

  const handleSearch = () => {
    if (!isAuthenticated) {
      showError(t('emergency.loginRequired'));
      return;
    }
    if (!isTrusted) {
      showError(t('emergency.trustRequired'));
      return;
    }
    if (!activeLocation) { showError(t('emergency.locationUnavailable')); return; }
    performSearch(activeLocation, saveAsHome);
  };

  const handleResetToGPS = () => {
    if (gpsLocation) {
      setSelectedLocation(null);
      setSearchQuery('');
      setSearchCoords('');
      showSuccess(t('emergency.gpsRestored'));
    } else {
      showError(t('emergency.gpsUnavailable'));
    }
  };

  // ── دوال الانضمام ──
  const handleSelectOfficialGroup = (group) => {
    if (!activeLocation) return;
    confirmToast(t('emergency.joinOfficial'), async () => {
      const r = await dispatch(confirmOfficialJoin({ groupId: group.id, latitude: activeLocation[0], longitude: activeLocation[1] }));
      if (confirmOfficialJoin.fulfilled.match(r)) {
        showSuccess(t('emergency.joinedSuccess'));
        dispatch(clearSearchResult());
        dispatch(fetchMyGroup());
      } else {
        showError(r.payload);
      }
    });
  };

  const handleSelectPendingGroup = (group) => {
    if (!activeLocation) return;
    confirmToast(t('emergency.joinPending'), async () => {
      const r = await dispatch(confirmPendingJoin({ pendingGroupId: group.id, latitude: activeLocation[0], longitude: activeLocation[1] }));
      if (confirmPendingJoin.fulfilled.match(r)) {
        showSuccess(t('emergency.joinedSuccess'));
        dispatch(clearSearchResult());
        dispatch(fetchMyGroup());
      } else {
        showError(r.payload);
      }
    });
  };

  const handleCreateNewPending = async () => {
    if (!activeLocation) return;
    confirmToast(t('emergency.createNew'), async () => {
      const r = await dispatch(confirmCreateNewPending({ latitude: activeLocation[0], longitude: activeLocation[1] }));
      if (confirmCreateNewPending.fulfilled.match(r)) {
        showSuccess(t('emergency.joinedSuccess'));
        dispatch(clearSearchResult());
        dispatch(fetchMyGroup());
      } else {
        showError(r.payload);
      }
    });
  };

  const handleSaveHome = async () => {
    if (!activeLocation) return;
    const r = await dispatch(saveHomeLocation({ homeLat: activeLocation[0], homeLng: activeLocation[1] }));
    if (saveHomeLocation.fulfilled.match(r)) { showSuccess(t('emergency.homeSaved')); setHomeSaved(true); }
    else showError(r.payload);
  };

  const handleSendSOS = async ({ emergencyType, severity, message }) => {
    if (!emergencyType) { showError(t('emergency.selectTypeFirst')); return; }
    if (!activeLocation) { showError(t('emergency.locationUnavailable')); return; }

    console.log('🚨 Sending SOS with location:', activeLocation);

    const r = await dispatch(sendSOS({
      case_type: emergencyType,
      custom_text: message,
      severity,
      location_lat: activeLocation[0],
      location_lng: activeLocation[1],
    }));

    if (sendSOS.fulfilled.match(r)) {
      showSuccess(t('emergency.sent'));
      setSosOpen(false);
      navigate('/my-case');
      dispatch(fetchRescueRequests({ perPage: 50, pending: true, active: true }));
    } else {
      showError(r.payload || t('emergency.sosFailed'));
    }
  };

  // ── حساب قائمة الغروبات المعروضة على الخريطة ──
  const mapGroups = useMemo(() => {
    const groups = [...officialGroupsList];
    if (currentGroup) {
      const centerLat = currentGroup.center?.[0] ?? 0;
      const centerLng = currentGroup.center?.[1] ?? 0;
      groups.push({
        id: currentGroup.group_id || `group-${Date.now()}`,
        name: currentGroup.group_name || 'غروبي',
        center_lat: centerLat,
        center_lng: centerLng,
        radius_km: currentGroup.radius_km || 5,
      });
    }
    return groups;
  }, [officialGroupsList, currentGroup]);

  // ── تحديد ما إذا كان زر SOS مفعلاً ──
  const canSendSOS = isAuthenticated && isTrusted && activeStatus?.can_join_other_emergencies !== false;

  // ── عرض حالة الغروب ──
  const renderGroupStatus = () => {
    console.log('🔍 renderGroupStatus - isTrusted:', isTrusted, 'currentGroup:', currentGroup, 'groupLoading:', groupLoading);

    if (!isAuthenticated) {
      return (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl text-center animate-fade-up">
          <p className="text-gray-600 dark:text-gray-300 mb-3">🔒 {t('emergency.loginToSearch')}</p>
          <Button text={t('login')} onClick={() => navigate('/login')} bgColor="bg-primary" textColor="text-white" />
        </div>
      );
    }

    if (groupLoading || isRefreshingGroup) {
      return (
        <div className="flex items-center justify-center gap-2 py-3 text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {t('common.loading')}...
        </div>
      );
    }

    if (!isTrusted) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-5 rounded-2xl text-center animate-fade-up">
          <p className="text-yellow-700 dark:text-yellow-300 font-medium mb-2">
            ⚠️ {t('emergency.trustRequired')}
          </p>
          <Button
            text={t('emergency.goToTrustVerification') || 'توثيق الحساب'}
            onClick={() => navigate('/trust-verification')}
            bgColor="bg-yellow-600"
            textColor="text-white"
          />
        </div>
      );
    }

    if (currentGroup) {
      const isOfficial = currentGroup.type === 'official';
      const isPending = currentGroup.type === 'pending';

      return (
        <div className={`p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${isOfficial
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
          <p className={`font-semibold ${isOfficial ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'} mb-1`}>
            {isOfficial ? <FaCheck className="inline" /> : <FaHourglassEnd className="inline text-yellow-500" />} {isOfficial ? t('emergency.myGroup') : t('emergency.pendingGroup')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {currentGroup.group_name} {isPending && `(${currentGroup.nearby_users_count || 0} ${t('emergency.usersNearby')})`}
          </p>
          {isPending && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              {t('emergency.pendingGroupDesc', 'سيتم تحويلك إلى غروب رسمي عند اكتمال العدد المطلوب')}
            </p>
          )}
          {isOfficial && currentGroup.chat_id && (
            <p className="text-xs text-gray-500 mt-1">ID: {currentGroup.chat_id}</p>
          )}
          <button
            onClick={handleRefreshGroup}
            disabled={isRefreshingGroup}
            className="mt-2 text-xs text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1"
          >
            <FaSync className={`${isRefreshingGroup ? 'animate-spin' : ''}`} />
            {isRefreshingGroup ? t('common.loading') : 'تحديث'}
          </button>
        </div>
      );
    }

    if (searchResult) {
      const { scenario } = searchResult;
      if (scenario === 'official_available') {
        const count = officialGroupsList.length;
        return (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 p-4 rounded-2xl space-y-3 animate-fade-up">
            <p className="text-blue-700 dark:text-blue-300">
              {count === 1 ? t('emergency.officialFound') : t('emergency.multipleOfficialFound', { count })}
            </p>
            <Button
              text={count === 1 ? t('emergency.joinOfficial') : t('emergency.chooseGroup')}
              onClick={() => count === 1 ? handleSelectOfficialGroup(officialGroupsList[0]) : (setGroupSelectorType('official'), setShowGroupSelector(true))}
              bgColor="bg-blue-600" textColor="text-white" disabled={joining}
            />
          </div>
        );
      }
      if (scenario === 'pending_only') {
        const count = pendingGroupsList.length;
        return (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 p-4 rounded-2xl space-y-3 animate-fade-up">
            <p className="text-amber-700 dark:text-amber-300">
              {count === 1 ? t('emergency.pendingFound') : t('emergency.multiplePendingFound', { count })}
            </p>
            <Button
              text={count === 1 ? t('emergency.joinPending') : t('emergency.chooseGroup')}
              onClick={() => count === 1 ? handleSelectPendingGroup(pendingGroupsList[0]) : (setGroupSelectorType('pending'), setShowGroupSelector(true))}
              bgColor="bg-amber-500" textColor="text-white" disabled={joining}
            />
          </div>
        );
      }
      if (scenario === 'none') {
        return (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl space-y-3 animate-fade-up">
            <p className="text-gray-600 dark:text-gray-300">{t('emergency.noGroup')}</p>
            <Button text={t('emergency.createNew')} onClick={handleCreateNewPending} bgColor="bg-primary" textColor="text-white" disabled={joining} />
          </div>
        );
      }
    }

    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl">
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{t('emergency.noGroupYet')}</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSearch}
            disabled={!activeLocation || isSearching || !isAuthenticated || !isTrusted}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 hover:shadow-lg hover:shadow-[var(--color-primary)]/25 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            <FaMagnifyingGlass className="text-xs" />
            {t('emergency.searchGroups')}
          </button>
          {selectedLocation && (
            <Button
              text={t('emergency.resetToGPS')} onClick={handleResetToGPS}
              bgColor="bg-gray-500" textColor="text-white" disabled={!gpsLocation}
              icon={<FaPeriscope className="text-xs" />}
            />
          )}
          <button
            onClick={handleSaveHome}
            disabled={!activeLocation || homeSaved}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-gray-500 text-white hover:bg-[var(--color-primary)]/90 hover:shadow-lg hover:shadow-[var(--color-primary)]/25 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            <FaHome className="text-xs" />
            {t('emergency.saveHome')}
          </button>
          <button
            onClick={handleRefreshGroup}
            disabled={isRefreshingGroup}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            <FaSync className={`${isRefreshingGroup ? 'animate-spin' : ''}`} />
            {isRefreshingGroup ? t('common.loading') : 'تحديث الغروب'}
          </button>
        </div>
        <label className="flex items-center gap-2 mt-3 text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
          <input type="checkbox" checked={saveAsHome} onChange={e => setSaveAsHome(e.target.checked)} className="accent-primary" />
          {t('emergency.saveAsHomeCheck')}
        </label>
      </div>
    );
  };

  // ── عرض حالة المستخدم النشطة ──
  const renderActiveStatusBanner = () => {
    if (!isAuthenticated || !activeStatus?.has_active_emergency) return null;

    const role = activeStatus.active_role;
    const activeId = activeStatus.active_emergency_id;

    if (role === 'CREATOR') {
      return (
        <div className="mb-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center justify-between flex-wrap gap-3 animate-fade-up">
          <div className="flex items-center gap-2">
            <span className="text-2xl"><FaBullhorn className="text-blue-500" /></span>
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {t('emergency.youHaveActiveCaseAsCreator')}
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-400">
                {t('emergency.activeCaseId')}: #{activeId}
              </p>
            </div>
          </div>
          <Button
            text={t('emergency.viewMyCase')}
            bgColor="bg-blue-500 hover:bg-blue-600"
            textColor="text-white"
            onClick={() => navigate('/my-case')}
            className="text-sm"
          />
        </div>
      );
    }

    if (role === 'PARTICIPANT') {
      return (
        <div className="mb-4 p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 flex items-center justify-between flex-wrap gap-3 animate-fade-up">
          <div className="flex items-center gap-2">
            <span className="text-2xl"><FaHandsHelping className="text-purple-500" /></span>
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                {t('emergency.youAreParticipatingInCase')}
              </p>
              <p className="text-xs text-purple-500 dark:text-purple-400">
                {t('emergency.activeCaseId')}: #{activeId}
              </p>
            </div>
          </div>
          <Button
            text={t('emergency.viewCase')}
            bgColor="bg-purple-500 hover:bg-purple-600"
            textColor="text-white"
            onClick={() => navigate(`/emergency/cases/${activeId}`)}
            className="text-sm"
          />
        </div>
      );
    }

    return null;
  };

  // ✅ موقع الخريطة
  const mapCenter = useMemo(() => {
    if (selectedLocation) return selectedLocation;
    if (gpsLocation) return gpsLocation;
    return null;
  }, [selectedLocation, gpsLocation]);

  return (
    <div className="container my-10">
      <Heading title={t('emergency.title')} subtitle={t('emergency.subtitle')} />

      {renderActiveStatusBanner()}

      <div className="mb-5">{renderGroupStatus()}</div>

      <div className="mb-5">
        <AvailabilityToggle />
      </div>

      {activeEmergencies.filter(e => e.userId === currentUser?.id).length > 0 && (
        <div className="mb-5 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 text-center animate-fade-up">
          <p className="text-red-600 dark:text-red-400 font-bold">🚨 {t('emergency.activeEmergencies', { count: activeEmergencies.length })}</p>
        </div>
      )}

      {/* ── البحث بالاسم ── */}
      <div className="mb-4 animate-fade-up">
        <form onSubmit={handleLocationSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('emergency.searchLocation', 'ابحث عن مدينة، حي، شارع...')}
              className={`w-full px-4 py-2.5 ${isRTL ? 'pl-10 pr-4' : 'pr-10 pl-4'
                } rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200`}
            />
            <FaSearch className={`absolute top-1/2 -translate-y-1/2 text-gray-400 text-sm ${isRTL ? 'left-3' : 'right-3'
              }`} />
          </div>
          <button
            type="submit"
            disabled={isSearchingLocation || !searchQuery.trim()}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            {isSearchingLocation ? t('common.loading') : t('common.search')}
          </button>
          {selectedLocation && (
            <button
              type="button"
              onClick={handleResetToGPS}
              className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98]"
              title={t('emergency.resetToGPS')}
            >
              <FaTimes />
            </button>
          )}
          <button
            type="button"
            onClick={handleRefreshGPS}
            disabled={isLocating}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            title="تحديث الموقع من GPS"
          >
            <FaSync className={`${isLocating ? 'animate-spin' : ''}`} />
          </button>
        </form>
        {geoCodeError && <p className="text-red-500 text-xs mt-1">{geoCodeError}</p>}
        {selectedLocation && (
          <p className="text-green-500 text-xs mt-1 animate-fade-up">
            <FaCheck className="inline" /> {t('emergency.locationSelected')}: {selectedLocation[0].toFixed(5)}, {selectedLocation[1].toFixed(5)}
          </p>
        )}
        {gpsLocation && !selectedLocation && (
          <p className="text-blue-500 text-xs mt-1 animate-fade-up">
            📍 {t('emergency.yourLocation')}: {gpsLocation[0].toFixed(5)}, {gpsLocation[1].toFixed(5)}
          </p>
        )}
        {isLocating && (
          <p className="text-gray-400 text-xs mt-1 animate-pulse">
            {t('emergency.locating')}
          </p>
        )}
      </div>

      {/* ── البحث بالإحداثيات ── */}
      <div className="mb-4 animate-fade-up">
        <form onSubmit={handleCoordSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchCoords}
              onChange={(e) => setSearchCoords(e.target.value)}
              placeholder={t('emergency.searchCoords', 'أدخل الإحداثيات (مثال: 36.254241, 37.184515)')}
              className={`w-full px-4 py-2.5 ${isRTL ? 'pl-10 pr-4' : 'pr-10 pl-4'
                } rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200`}
            />
            <FaMapPin className={`absolute top-1/2 -translate-y-1/2 text-gray-400 text-sm ${isRTL ? 'left-3' : 'right-3'
              }`} />
          </div>
          <button
            type="submit"
            disabled={isSearchingCoords || !searchCoords.trim()}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            {isSearchingCoords ? t('common.loading') : t('common.search')}
          </button>
        </form>
      </div>

      {/* ── الخريطة ── */}
      <div className="h-96 w-full rounded-2xl overflow-hidden mb-8 shadow-lg relative z-0 transition-shadow duration-300 hover:shadow-xl">
        {isLocating && !gpsLocation && !geoError && (
          <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 text-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              {t('emergency.locating')}
            </div>
          </div>
        )}
        {geoError && (
          <div className="h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 text-red-500 gap-3">
            <p className="text-sm">{geoError}</p>
            <button onClick={handleRefreshGPS} className="text-primary underline text-sm hover:text-primary/80 transition-colors flex items-center gap-2">
              <FaSync /> {t('emergency.retry')}
            </button>
          </div>
        )}
        {loadMap && (
          <Suspense fallback={
            <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">{t('common.loading')}</p>
              </div>
            </div>
          }>
            <LazyMap
              key={mapCenter ? `map-${mapCenter[0].toFixed(4)}-${mapCenter[1].toFixed(4)}` : 'no-location'}
              userLocation={gpsLocation}
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              groups={mapGroups}
              waitingList={pendingGroupsList}
              isLocating={isLocating}
            />
          </Suspense>
        )}
      </div>

      {/* ── الأزرار ── */}
      <div className="flex flex-wrap justify-center gap-3">
        {isAuthenticated && isTrusted && (
          <>
            <Button
              text={t('emergency.sos')}
              bgColor="bg-red-600 hover:bg-red-700"
              textColor="text-white"
              onClick={() => setSosOpen(true)}
              icon={<FaExclamationTriangle className="text-sm" />}
              disabled={!canSendSOS || sosLoading}
              title={!canSendSOS ? t('emergency.sosDisabledActiveCase') : ''}
            />

            <button
              onClick={() => navigate('/emergency-chat')}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg hover:shadow-[var(--color-primary)]/30 active:scale-[0.98] flex items-center gap-2"
            >
              <FaComments className="text-sm" />
              {t('emergency.chat')}
            </button>

            <button
              onClick={() => navigate('/my-case')}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg hover:shadow-[var(--color-primary)]/30 active:scale-[0.98] flex items-center gap-2"
            >
              <FaClipboardList className="text-sm" />
              {t('emergency.myCase')}
            </button>

            <button
              onClick={() => navigate('/group-members')}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg hover:shadow-[var(--color-primary)]/30 active:scale-[0.98] flex items-center gap-2"
            >
              <FaUsers className="text-sm" />
              {t('emergency.viewGroupMembers')}
            </button>

            <button
              onClick={() => navigate('/emergency/rescue-requests')}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-orange-600 hover:bg-orange-700 text-white hover:shadow-lg hover:shadow-[var(--color-primary)]/30 active:scale-[0.98] flex items-center gap-2"
            >
              <FaClipboardList className="text-sm" />
              {t('emergency.viewRescueRequests')}
            </button>

            <button
              onClick={() => navigate('/emergency/cases-hub')}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-cyan-600 hover:bg-cyan-700 text-white hover:shadow-lg hover:shadow-cyan-500/30 active:scale-[0.98] flex items-center gap-2"
            >
              <FaList className="text-sm" />
              {t('emergency.casesHub') || 'لوحة الحالات'}
            </button>
          </>
        )}
      </div>

      <SOSModal
        isOpen={sosOpen}
        onClose={() => setSosOpen(false)}
        onSend={handleSendSOS}
        loading={sosLoading}
        t={t}
      />

      <SelectGroupModal
        isOpen={showGroupSelector}
        onClose={() => setShowGroupSelector(false)}
        groups={groupSelectorType === 'official' ? officialGroupsList : pendingGroupsList}
        onSelect={groupSelectorType === 'official' ? handleSelectOfficialGroup : handleSelectPendingGroup}
        title={groupSelectorType === 'official' ? t('emergency.selectOfficialGroup') : t('emergency.selectPendingGroup')}
      />
    </div>
  );
};

export default EmergencyPage;