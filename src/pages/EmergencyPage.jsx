import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaComments, FaClipboardList, FaHome, FaSearch, FaTimes, FaMapPin } from 'react-icons/fa';
import { FaMagnifyingGlass, FaPeriscope } from 'react-icons/fa6';
import {
  searchGroups, confirmOfficialJoin, confirmPendingJoin,
  confirmCreateNewPending, saveHomeLocation,
  fetchMyGroup, clearSearchResult, clearCurrentGroup,
} from '../redux/slices/emergencyGroupsSlice';
import { sendSOS } from '../redux/slices/emergencySosSlice';
import { setGroups } from '../redux/slices/geoGroupsSlice';
import { useGeocoder } from '../hooks/useGeocoder';
import { useGeoGroup } from '../hooks/useGeoGroup';
import Button from '../components/Shared/Button';
import Heading from '../components/Shared/Heading';
import { showSuccess, showError, confirmToast } from '../utils/toastHelpers';


const LazyMap = lazy(() => import('../components/Emergency/MapWithGroups'));

// ── Group selector modal ───────────────────────────────────────
const SelectGroupModal = ({ isOpen, onClose, groups, onSelect, title }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="space-y-2">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => { onSelect(group); onClose(); }}
              className="w-full text-right p-3 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <p className="font-semibold">{group.name}</p>
              <p className="text-xs text-gray-400">ID: {group.id}</p>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm">
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-5">{t('emergency.reportEmergency')}</h3>

        <label className="block text-xs font-medium text-gray-500 mb-1">{t('emergency.selectEmergencyType')}</label>
        <select
          value={emergencyType}
          onChange={e => setEmergencyType(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">{t('emergency.selectType')}</option>
          <option value="fire">{t('emergency.fire')}</option>
          <option value="accident">{t('emergency.accident')}</option>
          <option value="medical">{t('emergency.medical')}</option>
          <option value="other">{t('emergency.other')}</option>
        </select>

        <label className="block text-xs font-medium text-gray-500 mb-1">{t('emergency.severityLevel')}</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { value: 'low', label: t('emergency.low'), color: 'bg-green-100 text-green-700 border-green-300' },
            { value: 'medium', label: t('emergency.medium'), color: 'bg-amber-100 text-amber-700 border-amber-300' },
            { value: 'high', label: t('emergency.high'), color: 'bg-red-100 text-red-700 border-red-300' },
          ].map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSeverity(s.value)}
              className={`py-2 rounded-xl border text-xs font-medium transition-all ${severity === s.value
                ? `${s.color} ring-2 ring-offset-1 ring-current`
                : 'bg-gray-50 dark:bg-gray-700 text-gray-500 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <label className="block text-xs font-medium text-gray-500 mb-1">{t('emergency.additionalDetails')}</label>
        <textarea
          placeholder={t('emergency.extra')}
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 mb-5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          rows={3}
        />

        <div className="flex gap-3 justify-end">
          <Button
            text={t('common.cancel')}
            bgColor="bg-gray-100 dark:bg-gray-700"
            textColor="text-gray-700 dark:text-gray-300"
            handler={onClose}
          />
          <Button
            text={loading ? t('common.loading') : t('emergency.send')}
            bgColor="bg-red-500 hover:bg-red-600"
            textColor="text-white"
            handler={handleSend}
            disabled={loading || !emergencyType}
          />
        </div>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────
const EmergencyPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { geocode, loading: geoLoading, error: geoCodeError } = useGeocoder();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const [searchCoords, setSearchCoords] = useState('');
  const [isSearchingCoords, setIsSearchingCoords] = useState(false);

  const [gpsLocation, setGpsLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [loadMap, setLoadMap] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [homeSaved, setHomeSaved] = useState(false);
  const [saveAsHome, setSaveAsHome] = useState(false);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [groupSelectorType, setGroupSelectorType] = useState('official');

  const { currentUser } = useSelector(s => s.user);
  const roles = useSelector(s => s.user.roles);
  const isAuthenticated = useSelector(s => s.user.isAuthenticated);
  const { activeEmergencies } = useSelector(s => s.emergency);
  const { currentGroup, searchResult, officialGroupsList, pendingGroupsList, loading: groupLoading, joining } =
    useSelector(s => s.emergencyGroups);
  const { loading: sosLoading } = useSelector(s => s.emergencySos);

  const isTrusted = roles?.includes('trusted') || currentUser?.role === 'trusted';
  const activeLocation = selectedLocation || gpsLocation;

  const userId = currentUser?.id || 'guest';
  const { assignedGroupId, isInWaiting, loading: geoGroupLoading } = useGeoGroup(activeLocation, userId);

  // ── جلب مجموعتي عند التحميل ──
  useEffect(() => {
    if (isAuthenticated && currentUser?.token) {
      dispatch(fetchMyGroup());
    } else {
      dispatch(clearCurrentGroup());
    }
  }, [isAuthenticated, currentUser?.token]);

  // ── GPS ──
  useEffect(() => {
    if (!navigator.geolocation) { setGeoError(t('emergency.geoNotSupported')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsLocation([pos.coords.latitude, pos.coords.longitude]); setLoadMap(true); },
      (err) => {
        if (err.code === 1) setGeoError(t('emergency.geoDenied'));
        else setGeoError(t('emergency.geoError'));
      }
    );
  }, [t]);

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

  const performSearch = useCallback(async (coords, saveHome = false) => {
    if (!isAuthenticated) {
      showError(t('emergency.loginRequired'));
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
  }, [dispatch, isAuthenticated, t, officialGroupsList, pendingGroupsList]);

  const handleSearch = () => {
    if (!isAuthenticated) {
      showError(t('emergency.loginRequired'));
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
        dispatch(fetchMyGroup()); // تحديث currentGroup
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
        dispatch(fetchMyGroup()); // تحديث currentGroup
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
    const r = await dispatch(sendSOS({
      case_type: emergencyType, custom_text: message,
      severity, location_lat: activeLocation[0], location_lng: activeLocation[1],
    }));
    if (sendSOS.fulfilled.match(r)) {
      showSuccess(t('emergency.sent'));
      setSosOpen(false);
      navigate('/my-case');
    } else {
      showError(r.payload || t('emergency.sosFailed'));
    }
  };

  // ── عرض حالة الغروب ──
  const renderGroupStatus = () => {
    if (!isAuthenticated) {
      return (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-3">🔒 {t('emergency.loginToSearch')}</p>
          <Button text={t('login')} handler={() => navigate('/login')} bgColor="bg-primary" textColor="text-white" />
        </div>
      );
    }

    if (groupLoading || isSearching || geoGroupLoading) {
      return (
        <div className="flex items-center justify-center gap-2 py-3 text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {t('common.loading')}
        </div>
      );
    }

    // ✅ عرض الغروب الحالي (رسمي أو معلق)
    if (currentGroup) {
      const isOfficial = currentGroup.type === 'official';
      const isPending = currentGroup.type === 'pending';

      return (
        <div className={`p-4 rounded-2xl border ${isOfficial 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}
        >
          <p className={`font-semibold ${isOfficial ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'} mb-1`}>
            {isOfficial ? '✅' : '⏳'} {isOfficial ? t('emergency.myGroup') : t('emergency.pendingGroup')}
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
        </div>
      );
    }

    // ── نتائج البحث ──
    if (searchResult) {
      const { scenario } = searchResult;
      if (scenario === 'official_available') {
        const count = officialGroupsList.length;
        return (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 p-4 rounded-2xl space-y-3">
            <p className="text-blue-700 dark:text-blue-300">
              {count === 1 ? t('emergency.officialFound') : t('emergency.multipleOfficialFound', { count })}
            </p>
            <Button
              text={count === 1 ? t('emergency.joinOfficial') : t('emergency.chooseGroup')}
              handler={() => count === 1 ? handleSelectOfficialGroup(officialGroupsList[0]) : (setGroupSelectorType('official'), setShowGroupSelector(true))}
              bgColor="bg-blue-600" textColor="text-white" disabled={joining}
            />
          </div>
        );
      }
      if (scenario === 'pending_only') {
        const count = pendingGroupsList.length;
        return (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 p-4 rounded-2xl space-y-3">
            <p className="text-amber-700 dark:text-amber-300">
              {count === 1 ? t('emergency.pendingFound') : t('emergency.multiplePendingFound', { count })}
            </p>
            <Button
              text={count === 1 ? t('emergency.joinPending') : t('emergency.chooseGroup')}
              handler={() => count === 1 ? handleSelectPendingGroup(pendingGroupsList[0]) : (setGroupSelectorType('pending'), setShowGroupSelector(true))}
              bgColor="bg-amber-500" textColor="text-white" disabled={joining}
            />
          </div>
        );
      }
      if (scenario === 'none') {
        return (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl space-y-3">
            <p className="text-gray-600 dark:text-gray-300">{t('emergency.noGroup')}</p>
            <Button text={t('emergency.createNew')} handler={handleCreateNewPending} bgColor="bg-primary" textColor="text-white" disabled={joining} />
          </div>
        );
      }
    }

    // ── لا يوجد غروب ولا بحث ──
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl">
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{t('emergency.noGroupYet')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            text={t('emergency.searchGroups')} handler={handleSearch}
            bgColor="bg-primary" textColor="text-white"
            disabled={!activeLocation || isSearching || !isAuthenticated}
            icon={<FaMagnifyingGlass className="text-xs" />}
          />
          {selectedLocation && (
            <Button
              text={t('emergency.resetToGPS')} handler={handleResetToGPS}
              bgColor="bg-gray-500" textColor="text-white" disabled={!gpsLocation}
              icon={<FaPeriscope className="text-xs" />}
            />
          )}
          <Button
            text={t('emergency.saveHome')} handler={handleSaveHome}
            bgColor="bg-gray-500" textColor="text-white"
            disabled={!activeLocation || homeSaved}
            icon={<FaHome className="text-xs" />}
          />
        </div>
        <label className="flex items-center gap-2 mt-3 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={saveAsHome} onChange={e => setSaveAsHome(e.target.checked)} />
          {t('emergency.saveAsHomeCheck')}
        </label>
      </div>
    );
  };

  return (
    <div className="container my-10">
      <Heading title={t('emergency.title')} subtitle={t('emergency.subtitle')} />
      <div className="mb-5">{renderGroupStatus()}</div>

      {activeEmergencies.filter(e => e.userId === currentUser?.id).length > 0 && (
        <div className="mb-5 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 text-center">
          <p className="text-red-600 dark:text-red-400 font-bold">🚨 {t('emergency.activeEmergencies', { count: activeEmergencies.length })}</p>
        </div>
      )}

      {/* البحث بالاسم */}
      <div className="mb-4">
        <form onSubmit={handleLocationSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('emergency.searchLocation', 'ابحث عن مدينة، حي، شارع...')}
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          </div>
          <button
            type="submit"
            disabled={isSearchingLocation || !searchQuery.trim()}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {isSearchingLocation ? t('common.loading') : t('common.search')}
          </button>
          {selectedLocation && (
            <button
              type="button"
              onClick={handleResetToGPS}
              className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-300 transition"
              title={t('emergency.resetToGPS')}
            >
              <FaTimes />
            </button>
          )}
        </form>
        {geoCodeError && <p className="text-red-500 text-xs mt-1">{geoCodeError}</p>}
        {selectedLocation && (
          <p className="text-green-500 text-xs mt-1">
            ✅ {t('emergency.locationSelected')}: {selectedLocation[0].toFixed(5)}, {selectedLocation[1].toFixed(5)}
          </p>
        )}
      </div>

      {/* البحث بالإحداثيات */}
      <div className="mb-4">
        <form onSubmit={handleCoordSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchCoords}
              onChange={(e) => setSearchCoords(e.target.value)}
              placeholder={t('emergency.searchCoords', 'أدخل الإحداثيات (مثال: 36.254241, 37.184515)')}
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <FaMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          </div>
          <button
            type="submit"
            disabled={isSearchingCoords || !searchCoords.trim()}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {isSearchingCoords ? t('common.loading') : t('common.search')}
          </button>
        </form>
      </div>

      {/* الخريطة */}
      <div className="h-96 w-full rounded-2xl overflow-hidden mb-8 shadow-lg relative z-0">
        {!gpsLocation && !geoError && (
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
            <button onClick={() => window.location.reload()} className="text-primary underline text-sm">
              {t('emergency.retry')}
            </button>
          </div>
        )}
        {(gpsLocation || selectedLocation) && loadMap && (
          <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-400 text-sm">{t('common.loading')}</div>}>
            <LazyMap
              userLocation={gpsLocation}
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              groups={officialGroupsList}
              waitingList={pendingGroupsList}
            />
          </Suspense>
        )}
      </div>

      {/* الأزرار */}
      <div className="flex flex-wrap justify-center gap-3">
        {isAuthenticated && isTrusted && (
          <>
            <Button
              text={t('emergency.sos')}
              bgColor="bg-red-600 hover:bg-red-700"
              textColor="text-white"
              handler={() => setSosOpen(true)}
              icon={<FaExclamationTriangle className="text-sm" />}
              disabled={sosLoading}
            />
            <Button
              text={t('emergency.chat')}
              bgColor="bg-blue-600 hover:bg-blue-700"
              textColor="text-white"
              handler={() => navigate('/emergency-chat')}
              icon={<FaComments className="text-sm" />}
            />
            <Button
              text={t('emergency.myCase')}
              bgColor="bg-purple-600 hover:bg-purple-700"
              textColor="text-white"
              handler={() => navigate('/my-case')}
              icon={<FaClipboardList className="text-sm" />}
            />
          </>
        )}
        {isAuthenticated && !currentGroup && activeLocation && (
          <Button
            text={t('emergency.refreshSearch')}
            handler={handleSearch}
            bgColor="bg-gray-500 hover:bg-gray-600"
            textColor="text-white"
            disabled={isSearching}
            icon={<FaMagnifyingGlass className="text-xs" />}
          />
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