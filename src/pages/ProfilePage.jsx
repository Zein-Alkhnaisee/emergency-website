import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FaUser, FaCamera, FaSave, FaEdit, FaArrowRight,
  FaGlobe, FaLock, FaPlus, FaStar, FaStarHalfAlt, FaRegStar,
} from 'react-icons/fa';
import {
  fetchMyProfile, createProfile, updateProfile, deleteProfile,
  fetchMyLocation, addLocation, updateLocationVisibility,
} from '../redux/slices/profileSlice';
import { fetchMyRatingStats, toggleRatable } from '../redux/slices/ratingsSlice';
import { fetchMyGroup } from '../redux/slices/emergencyGroupsSlice';
import { showSuccess, showError, confirmToast } from '../utils/toastHelpers';
import Button from '../components/Shared/Button';
import Heading from '../components/Shared/Heading';
import LocationPickerMap from '../components/Profile/LocationPickerMap';

// ── Reverse geocode helper ─────────────────────────────────────
const fetchAddressFromCoords = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=ar`
    );
    const data = await res.json();
    const addr = data?.address || {};
    return {
      country: addr.country || '',
      city: addr.city || addr.town || addr.village || addr.state || '',
    };
  } catch {
    return { country: '', city: '' };
  }
};

// ── Field wrapper ──────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
    {children}
  </div>
);

const inputCls = (disabled) =>
  `w-full px-3 py-2.5 text-sm rounded-xl border transition
   ${disabled
     ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700 text-gray-500 cursor-default'
     : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40'
   }`;

// ── Main ───────────────────────────────────────────────────────
const ProfilePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: profile, location: loc, loading } = useSelector(s => s.profile);
  const { currentUser, roles } = useSelector(s => s.user);
  const { myStats } = useSelector(s => s.ratings || { myStats: null });
  const { currentGroup } = useSelector(s => s.emergencyGroups);

  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLoc, setSavingLoc] = useState(false);
  const [isFetchingAddr, setIsFetchingAddr] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [mapInitLoc, setMapInitLoc] = useState(null);
  const [isRatable, setIsRatable] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    phone: '', gender: '', country: '', state: '', city: '', bio: '',
    is_location_public: false, is_phone_public: false,
  });
  const [locForm, setLocForm] = useState({
    latitude: '', longitude: '', country: '', state: '', city: '',
  });

  const isTrusted = roles?.includes('trusted') || currentUser?.role === 'trusted';
  const groupId = currentGroup?.group_id;

  // ── جلب الملف الشخصي والموقع ──────────────────────────────
  useEffect(() => {
    dispatch(fetchMyProfile());
    dispatch(fetchMyLocation());
  }, [dispatch]);

  // ── جلب مجموعتي الحقيقية (لا نعتمد على أن صفحة أخرى جلبتها مسبقاً) ──
  // هذا هو سبب المشكلة: عند الدخول مباشرة لصفحة البروفايل (أو بعد
  // تحديث الصفحة) كانت currentGroup فارغة، فكان الكود يستخدم قيمة
  // وهمية ثابتة (1) بدل المجموعة الحقيقية، فتظهر الصفحة "لا توجد تقييمات"
  // رغم أن التقييم محفوظ فعلياً على المجموعة الصحيحة.
  useEffect(() => {
    if (isTrusted && !groupId) {
      dispatch(fetchMyGroup());
    }
  }, [dispatch, isTrusted, groupId]);

  // ── جلب إحصاءات التقييم (فقط بعد توفر groupId الحقيقي) ──
  useEffect(() => {
    if (!isTrusted || !groupId) return;
    setStatsLoading(true);
    dispatch(fetchMyRatingStats(groupId)).finally(() => {
      setStatsLoading(false);
    });
  }, [dispatch, isTrusted, groupId]);

  // ── مزامنة البيانات مع النموذج ────────────────────────────
  useEffect(() => {
    if (profile) {
      setForm({
        phone: profile.phone || '',
        gender: profile.gender || '',
        country: profile.country || '',
        state: profile.state || '',
        city: profile.city || '',
        bio: profile.bio || '',
        is_location_public: profile.is_location_public ?? false,
        is_phone_public: profile.is_phone_public ?? false,
      });
      setAvatarPreview(profile.avatar || null);
      setIsEditing(false);
      setShowCreateForm(false);
    } else {
      setShowCreateForm(false);
      setIsEditing(false);
      setForm({
        phone: '', gender: '', country: '', state: '', city: '', bio: '',
        is_location_public: false, is_phone_public: false,
      });
      setAvatarPreview(null);
    }
  }, [profile]);

  // ── مزامنة الموقع ─────────────────────────────────────────
  useEffect(() => {
    if (loc?.latitude) {
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
      setLocForm({
        latitude: loc.latitude,
        longitude: loc.longitude,
        country: loc.country || '',
        state: loc.state || '',
        city: loc.city || '',
      });
      setMapInitLoc([lat, lng]);
    } else {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setMapInitLoc(coords);
          setLocForm(prev => ({
            ...prev,
            latitude: coords[0],
            longitude: coords[1],
          }));
          reverseGeocode(coords[0], coords[1]);
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, [loc]);

  // ── تحديث حالة isRatable من myStats ──────────────────────
  useEffect(() => {
    if (myStats?.user) {
      setIsRatable(myStats.user.is_ratable ?? false);
    }
  }, [myStats]);

  const reverseGeocode = useCallback(async (lat, lng) => {
    setIsFetchingAddr(true);
    const { country, city } = await fetchAddressFromCoords(lat, lng);
    setLocForm(prev => ({
      ...prev,
      country: country || prev.country,
      city:    city    || prev.city,
    }));
    setIsFetchingAddr(false);
  }, []);

  const handleMapSelect = useCallback(async (coords) => {
    setLocForm(prev => ({ ...prev, latitude: coords[0], longitude: coords[1] }));
    await reverseGeocode(coords[0], coords[1]);
  }, [reverseGeocode]);

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setIsEditing(true);
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    let result;
    if (profile) {
      result = await dispatch(updateProfile({ updates: form, avatarFile }));
    } else {
      result = await dispatch(createProfile({ profileData: form, avatarFile }));
    }
    setSavingProfile(false);
    if (updateProfile.fulfilled.match(result) || createProfile.fulfilled.match(result)) {
      showSuccess(profile ? t('profile.updateSuccess') : t('profile.createSuccess'));
      setIsEditing(false);
      setShowCreateForm(false);
      setAvatarFile(null);
    } else {
      showError(result.payload);
    }
  };

  const handleDeleteProfile = () => {
    confirmToast(t('profile.confirmDelete'), async () => {
      const result = await dispatch(deleteProfile());
      if (deleteProfile.fulfilled.match(result)) {
        showSuccess(t('profile.deleteSuccess'));
        setIsEditing(false);
        setShowCreateForm(false);
      } else {
        showError(result.payload);
      }
    });
  };

  const handleLocationSave = async () => {
    if (!locForm.latitude || !locForm.longitude) {
      showError(t('profile.selectLocation'));
      return;
    }
    setSavingLoc(true);
    const result = await dispatch(addLocation({
      latitude:  parseFloat(locForm.latitude),
      longitude: parseFloat(locForm.longitude),
      country:   locForm.country,
      state:     locForm.state,
      city:      locForm.city,
    }));
    setSavingLoc(false);
    if (addLocation.fulfilled.match(result)) {
      showSuccess(t('profile.locationSaved'));
    } else {
      showError(result.payload);
    }
  };

  const handleVisibility = async (isPublic) => {
    const result = await dispatch(updateLocationVisibility(isPublic));
    if (updateLocationVisibility.fulfilled.match(result)) {
      showSuccess(isPublic ? t('profile.locationPublic') : t('profile.locationPrivate'));
    } else {
      showError(result.payload);
    }
  };

  const handleToggleRatable = async () => {
    const newValue = !isRatable;
    const result = await dispatch(toggleRatable(newValue));
    if (toggleRatable.fulfilled.match(result)) {
      setIsRatable(newValue);
      showSuccess(newValue ? t('profile.ratableEnabled') : t('profile.ratableDisabled'));
    } else {
      showError(result.payload);
    }
  };

  // ── عرض إحصاءات التقييم (نجوم) ──────────────────────────────
  const renderRatingStats = () => {
    // ✅ دائماً نعرض القسم للمستخدمين الموثقين
    if (!isTrusted) return null;

    const hasStats = myStats && myStats.total > 0;
    const total = myStats?.total || 0;
    const average = myStats?.average || 0;
    const avgPercent = myStats?.average_percent || 0;
    const qualifiesAdmin = myStats?.qualifies_admin || false;

    // حساب النجوم
    const avg = average || 0;
    const fullStars = Math.floor(avg);
    const hasHalfStar = avg % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {t('profile.ratingStats')}
          </h3>
          <button
            onClick={handleToggleRatable}
            className={`text-xs px-3 py-1 rounded-full transition ${
              isRatable
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {isRatable ? t('profile.ratableOn') : t('profile.ratableOff')}
          </button>
        </div>

        {statsLoading || !groupId ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasStats ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
            {t('profile.noRatingsYet')}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('profile.totalRatings')}</span>
                <span className="font-bold text-lg">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('profile.averageRating')}</span>
                <span className="font-bold text-lg text-primary">{avg.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(fullStars)].map((_, i) => (
                  <FaStar key={`full-${i}`} className="text-yellow-400 text-lg" />
                ))}
                {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 text-lg" />}
                {[...Array(emptyStars)].map((_, i) => (
                  <FaRegStar key={`empty-${i}`} className="text-gray-300 dark:text-gray-500 text-lg" />
                ))}
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="mt-3 w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(avgPercent, 100)}%` }}
              />
            </div>

            {qualifiesAdmin && (
              <div className="mt-2 text-xs text-primary font-medium text-center">
                {t('profile.qualifiesAdmin')}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── حالة عدم وجود ملف شخصي ────────────────────────────────
  if (!profile && !showCreateForm) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Heading title={t('nav.profile')} subtitle={t('profile.manageData')} />
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 transition"
          >
            <FaArrowRight /> {t('common.back')}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md py-8 p-8 text-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            {t('profile.noProfile')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('profile.noProfileDesc')}
          </p>
          <Button
            text={t('profile.create')}
            bgColor="bg-primary"
            textColor="text-white"
            handler={handleShowCreateForm}
            icon={<FaPlus className="mr-2" />}
          />
        </div>

        {/* عرض إحصاءات التقييم حتى في حالة عدم وجود ملف */}
        {renderRatingStats()}
      </div>
    );
  }

  // ── عرض الملف الشخصي ──────────────────────────────────────
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Heading title={t('nav.profile')} subtitle={t('profile.manageData')} />
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 transition"
        >
          <FaArrowRight /> {t('common.back')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {profile ? t('profile.title') : t('profile.create')}
          </h2>
          {profile ? (
            <button
              onClick={isEditing ? handleProfileSave : () => setIsEditing(true)}
              disabled={savingProfile}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/70 transition disabled:opacity-50"
            >
              {isEditing ? <><FaSave /> {savingProfile ? t('common.loading') : t('profile.save')}</> : <><FaEdit /> {t('profile.edit')}</>}
            </button>
          ) : (
            <button
              onClick={handleProfileSave}
              disabled={savingProfile}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/70 transition disabled:opacity-50"
            >
              <FaSave /> {savingProfile ? t('common.loading') : t('profile.save')}
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20" alt={t('profile.avatar')} />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <FaUser className="text-3xl text-primary/60" />
                </div>
              )}
              {(isEditing || showCreateForm) && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full hover:bg-primary/90 transition"
                >
                  <FaCamera className="text-xs"/>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                }}
              />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">{currentUser?.name}</p>
              <p className="text-sm text-gray-400">{currentUser?.email}</p>
            </div>
          </div>

          {/* الحقول */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t('profile.phone')}>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                disabled={!isEditing && !!profile}
                className={inputCls(!isEditing && !!profile)}
                placeholder={t('profile.phonePlaceholder')}
              />
            </Field>
            <Field label={t('profile.gender')}>
              <select
                value={form.gender}
                onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                disabled={!isEditing && !!profile}
                className={inputCls(!isEditing && !!profile)}
              >
                <option value="">{t('profile.selectGender')}</option>
                <option value="male">{t('profile.male')}</option>
                <option value="female">{t('profile.female')}</option>
              </select>
            </Field>
            <Field label={t('profile.country')}>
              <input
                value={form.country}
                onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                disabled={!isEditing && !!profile}
                className={inputCls(!isEditing && !!profile)}
              />
            </Field>
            <Field label={t('profile.city')}>
              <input
                value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                disabled={!isEditing && !!profile}
                className={inputCls(!isEditing && !!profile)}
              />
            </Field>
            <Field label={t('profile.bio')}>
              <textarea
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                disabled={!isEditing && !!profile}
                rows={2}
                className={`${inputCls(!isEditing && !!profile)} resize-none col-span-2`}
              />
            </Field>
          </div>

          {(isEditing || showCreateForm) && (
            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <div
                  onClick={() => setForm(p => ({ ...p, is_location_public: !p.is_location_public }))}
                  className={`w-10 h-5 rounded-full transition-colors ${form.is_location_public ? 'bg-primary' : 'bg-gray-300'} relative`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_location_public ? 'right-0.5' : 'left-0.5'}`} />
                </div>
                {t('profile.showLocation')}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <div
                  onClick={() => setForm(p => ({ ...p, is_phone_public: !p.is_phone_public }))}
                  className={`w-10 h-5 rounded-full transition-colors ${form.is_phone_public ? 'bg-primary' : 'bg-gray-300'} relative`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_phone_public ? 'right-0.5' : 'left-0.5'}`} />
                </div>
                {t('profile.showPhone')}
              </label>
            </div>
          )}

          {(isEditing || showCreateForm) && (
            <div className="flex gap-3 pt-2">
              <Button
                text={savingProfile ? t('common.loading') : (profile ? t('profile.save') : t('profile.create'))}
                handler={handleProfileSave}
                bgColor="bg-primary"
                textColor="text-white"
                disabled={savingProfile}
              />
              {profile && (
                <Button
                  text={t('common.cancel')}
                  handler={() => { setIsEditing(false); setAvatarFile(null); }}
                  bgColor="bg-gray-100 dark:bg-gray-700"
                  textColor="text-gray-700 dark:text-gray-300"
                />
              )}
              {!profile && (
                <Button
                  text={t('common.cancel')}
                  handler={() => { setShowCreateForm(false); setIsEditing(false); setAvatarFile(null); }}
                  bgColor="bg-gray-100 dark:bg-gray-700"
                  textColor="text-gray-700 dark:text-gray-300"
                />
              )}
              {profile && (
                <Button
                  text={t('profile.delete')}
                  handler={handleDeleteProfile}
                  bgColor="bg-red-500"
                  textColor="text-white"
                />
              )}
            </div>
          )}
        </div>

        {/* عرض إحصاءات التقييم داخل الملف الشخصي */}
        {renderRatingStats()}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('profile.location')}</h2>
          {loc?.latitude && (
            <button
              onClick={() => handleVisibility(!loc.is_location_public)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition ${
                loc.is_location_public
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {loc.is_location_public ? <><FaGlobe /> {t('profile.public')}</> : <><FaLock /> {t('profile.private')}</>}
            </button>
          )}
        </div>

        <div className="rounded-xl overflow-hidden mb-4">
          <LocationPickerMap
            initialLocation={mapInitLoc}
            onLocationSelect={handleMapSelect}
            height="280px"
          />
          {isFetchingAddr && (
            <p className="text-xs text-gray-400 mt-1 text-center">{t('common.loading')}...</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label={t('profile.latitude')}>
            <input
              type="number"
              step="any"
              value={locForm.latitude}
              onChange={e => setLocForm(p => ({ ...p, latitude: e.target.value }))}
              className={inputCls(false)}
            />
          </Field>
          <Field label={t('profile.longitude')}>
            <input
              type="number"
              step="any"
              value={locForm.longitude}
              onChange={e => setLocForm(p => ({ ...p, longitude: e.target.value }))}
              className={inputCls(false)}
            />
          </Field>
          <Field label={t('profile.country')}>
            <input
              value={locForm.country}
              onChange={e => setLocForm(p => ({ ...p, country: e.target.value }))}
              className={inputCls(false)}
            />
          </Field>
          <Field label={t('profile.city')}>
            <input
              value={locForm.city}
              onChange={e => setLocForm(p => ({ ...p, city: e.target.value }))}
              className={inputCls(false)}
            />
          </Field>
        </div>

        <Button
          text={savingLoc ? t('common.loading') : t('profile.saveLocation')}
          handler={handleLocationSave}
          bgColor="bg-primary"
          textColor="text-white"
          disabled={savingLoc}
        />
      </div>
    </div>
  );
};

export default ProfilePage;