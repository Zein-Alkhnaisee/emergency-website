// src/pages/ServicesPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FaPlus, FaMapMarkerAlt, FaList,
  FaBookmark, FaUserCog, FaCalendarCheck,
  FaSearchLocation, FaCheckCircle, FaTimesCircle,
  FaCrosshairs, FaUsers, FaExclamationTriangle,
  FaLock, FaInbox, FaBoxOpen
} from 'react-icons/fa';
import * as servicesActions from '../redux/slices/servicesSlice';
import Heading from '../components/Shared/Heading';
import ServiceCard from '../components/Services/ServiceCard';
import ServiceListItem from '../components/Services/ServiceListItem';
import ServiceFilters from '../components/Services/ServiceFilters';
import AddServiceModal from '../components/Services/AddServiceModal';
import BookingModal from '../components/Services/BookingModal';
import Button from '../components/Shared/Button';
import LocationPickerMap from '../components/Profile/LocationPickerMap';
import { showSuccess, showError, confirmToast } from '../utils/toastHelpers';
import { SkeletonServiceCard } from '../components/UI/Skeleton';

const {
  fetchHomeServices,
  fetchCategories,
  fetchCities,
  fetchMyServices,
  fetchMyBookings,
  fetchReceivedBookings,
  fetchNearbyServices,
  setFilterCity,
  setFilterCategory,
  approveBooking,
  rejectBooking,
  completeBooking,
  clearNearbyServices,
} = servicesActions;

const TABS = {
  ALL: 'all',
  NEARBY: 'nearby',
  MY_SERVICES: 'my_services',
  MY_BOOKINGS: 'my_bookings',
  RECEIVED: 'received',
};

const ServicesPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    services,
    nearbyServices,
    categories,
    cities,
    filterCity,
    filterCategory,
    loading,
    myServices,
    myBookings,
    receivedBookings,
  } = useSelector(s => s.services);
  const { currentUser, isAuthenticated, roles } = useSelector(s => s.user);
  const { currentGroup } = useSelector(s => s.emergencyGroups);
  const [activeTab, setActiveTab] = useState(TABS.ALL);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [nearbyLocation, setNearbyLocation] = useState(null);
  const [nearbyMapLocation, setNearbyMapLocation] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const isTrusted = roles?.includes('trusted') || currentUser?.role === 'trusted';
  const hasGroup = !!currentGroup;

  // ── جلب الموقع القريب ──
  useEffect(() => {
    if (isAuthenticated && navigator.geolocation && !nearbyLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setNearbyLocation(loc);
          setNearbyMapLocation([loc.latitude, loc.longitude]);
        },
        () => {
        setNearbyLocation(null);
        setNearbyMapLocation(null);
        showError(t('services.locationError'));
      }
      );
    }
  }, [isAuthenticated]);

  // ── جلب البيانات (فقط إذا كان المستخدم موثقاً ومنضماً لغروب) ──
  useEffect(() => {
    if (isAuthenticated && isTrusted && hasGroup) {
      dispatch(fetchHomeServices());
      dispatch(fetchCategories());
      dispatch(fetchCities());
      dispatch(fetchMyServices());
      dispatch(fetchMyBookings());
      dispatch(fetchReceivedBookings());
    }
  }, [dispatch, isAuthenticated, isTrusted, hasGroup]);

  // ── جلب الخدمات القريبة ──
  useEffect(() => {
    if (activeTab === TABS.NEARBY && nearbyLocation && isAuthenticated && isTrusted && hasGroup) {
      setNearbyLoading(true);
      dispatch(fetchNearbyServices({
        latitude: nearbyLocation.latitude,
        longitude: nearbyLocation.longitude,
      })).finally(() => setNearbyLoading(false));
    } else if (activeTab !== TABS.NEARBY) {
      dispatch(clearNearbyServices());
    }
  }, [activeTab, nearbyLocation, dispatch, isAuthenticated, isTrusted, hasGroup]);

  const handleNearbyMapSelect = (coords) => {
    setNearbyMapLocation(coords);
    setNearbyLocation({
      latitude: coords[0],
      longitude: coords[1],
    });
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setNearbyLocation(loc);
          setNearbyMapLocation([loc.latitude, loc.longitude]);
          showSuccess(t('services.locationUpdated'));
        },
        () => {
          showError(t('services.locationError'));
        }
      );
    } else {
      showError(t('services.geoNotSupported'));
    }
  };

  const filteredServices = useMemo(() => {
    let result = [...services];
    if (filterCity !== 'الكل') {
      result = result.filter(s => s.city === filterCity);
    }
    if (filterCategory !== 'الكل') {
      result = result.filter(s => s.category_id === parseInt(filterCategory) || s.category?.id === parseInt(filterCategory));
    }
    return result;
  }, [services, filterCity, filterCategory]);

  const handleBookService = (service, location = null) => {
    setSelectedService({ ...service, bookingLocation: location || nearbyLocation });
    setIsBookingModalOpen(true);
  };

  // ── عرض المحتوى حسب التاب المختار ──
  const renderContent = () => {
    switch (activeTab) {
      case TABS.NEARBY:
        return (
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-4 mb-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                  {t('services.selectLocationOnMap')}
                </h4>
                <button
                  onClick={handleUseCurrentLocation}
                  className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)]/70 transition-colors duration-200 hover:scale-105"
                >
                  <FaCrosshairs /> {t('services.useMyLocation')}
                </button>
              </div>
              <div className="h-52 rounded-xl overflow-hidden shadow-inner">
                <LocationPickerMap
                  initialLocation={nearbyMapLocation}
                  onLocationSelect={handleNearbyMapSelect}
                  height="100%"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {t('services.nearbyMapHint')}
              </p>
            </div>

            {nearbyLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : nearbyServices.length === 0 ? (
              <div className="text-center py-12 text-gray-400 animate-fade-up">
                {t('services.noNearbyServices')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyServices.map((service, idx) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    index={idx}
                    onBook={() => handleBookService(service, nearbyLocation)}
                    showDistance
                  />
                ))}
              </div>
            )}
          </div>
        );
      case TABS.MY_SERVICES:
        return (
          <div className="space-y-4 animate-fade-up">
            {myServices.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {t('services.noMyServices')}
              </div>
            ) : (
              myServices.map((service, idx) => (
                <ServiceListItem key={service.id} service={service} index={idx} isMyService />
              ))
            )}
          </div>
        );
      case TABS.MY_BOOKINGS:
        return (
          <div className="space-y-4 animate-fade-up">
            {myBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {t('services.noMyBookings')}
              </div>
            ) : (
              myBookings.map((booking, idx) => (
                <BookingCard key={booking.id} booking={booking} index={idx} />
              ))
            )}
          </div>
        );
      case TABS.RECEIVED:
        return (
          <div className="space-y-4 animate-fade-up">
            {receivedBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {t('services.noReceivedBookings')}
              </div>
            ) : (
              receivedBookings.map((booking, idx) => (
                <ReceivedBookingCard key={booking.id} booking={booking} index={idx} />
              ))
            )}
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
            {filteredServices.map((service, idx) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={idx}
                onBook={() => handleBookService(service)}
              />
            ))}
          </div>
        );
    }
  };

  // ── 1. المستخدم غير مسجل دخول ──
  if (!isAuthenticated) {
    return (
      <div className="container my-10">
        <Heading title={t('services.title')} subtitle={t('services.subtitle')} />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 text-center animate-fade-up border border-gray-100 dark:border-gray-700">
          <div className="flex justify-center text-5xl mb-4 text-gray-400">
            <FaLock />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-2">
            {t('services.loginRequired')}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {t('services.loginToAccessServices', 'سجل دخولك للوصول إلى الخدمات وعرضها')}
          </p>
          <Button
            text={t('login')}
            bgColor="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
            textColor="text-white"
            handler={() => navigate('/login')}
            className="shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/40"
          />
        </div>
      </div>
    );
  }

  // ── 2. المستخدم مسجل دخول ولكن ليس موثقاً ──
  if (isAuthenticated && !isTrusted) {
    return (
      <div className="container my-10">
        <Heading title={t('services.title')} subtitle={t('services.subtitle')} />
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl shadow-md p-8 text-center animate-fade-up">
          <div className="flex justify-center text-5xl mb-4 text-yellow-500">
            <FaExclamationTriangle />
          </div>
          <p className="text-yellow-700 dark:text-yellow-300 text-lg font-medium mb-2">
            {t('services.trustRequired', 'يجب توثيق الحساب للوصول إلى الخدمات')}
          </p>
          <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-6">
            {t('services.trustRequiredDesc', 'قم بتوثيق حسابك لتتمكن من عرض وإضافة الخدمات')}
          </p>
          <Button
            text={t('nav.trustVerification')}
            bgColor="bg-yellow-600 hover:bg-yellow-700"
            textColor="text-white"
            handler={() => navigate('/trust-verification')}
            className="shadow-yellow-600/30 hover:shadow-yellow-600/40"
          />
        </div>
      </div>
    );
  }

  // ── 3. المستخدم موثق ولكن ليس منضماً لغروب ──
  if (isAuthenticated && isTrusted && !hasGroup) {
    return (
      <div className="container my-10">
        <Heading title={t('services.title')} subtitle={t('services.subtitle')} />
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-md p-8 text-center animate-fade-up">
          <div className="flex justify-center text-5xl mb-4 text-blue-500">
            <FaMapMarkerAlt />
          </div>
          <p className="text-blue-700 dark:text-blue-300 text-lg font-medium mb-2">
            {t('services.joinGroupRequired', 'يجب الانضمام إلى غروب للوصول إلى الخدمات')}
          </p>
          <p className="text-blue-600 dark:text-blue-400 text-sm mb-6">
            {t('services.joinGroupDesc', 'انضم إلى غروب قريب منك لتتمكن من عرض الخدمات المتاحة وإضافتها')}
          </p>
          <Button
            text={t('emergency.goToEmergency')}
            bgColor="bg-blue-600 hover:bg-blue-700"
            textColor="text-white"
            handler={() => navigate('/#emergency')}
            className="shadow-blue-600/30 hover:shadow-blue-600/40"
          />
        </div>
      </div>
    );
  }

  // ── 4. المستخدم في غروب ولكن لا توجد خدمات ──
  const hasServices = services.length > 0 || nearbyServices.length > 0 || myServices.length > 0;

  return (
    <div id="services" className="container my-10 scroll-mt-20">
      <Heading title={t('services.title')} subtitle={t('services.subtitle')} />

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <TabButton
          active={activeTab === TABS.ALL}
          onClick={() => setActiveTab(TABS.ALL)}
          icon={<FaList />}
          label={t('services.allServices')}
          count={filteredServices.length}
        />
        <TabButton
          active={activeTab === TABS.NEARBY}
          onClick={() => setActiveTab(TABS.NEARBY)}
          icon={<FaSearchLocation />}
          label={t('services.nearbyServices')}
          count={nearbyServices.length}
        />
        <TabButton
          active={activeTab === TABS.MY_SERVICES}
          onClick={() => setActiveTab(TABS.MY_SERVICES)}
          icon={<FaUserCog />}
          label={t('services.myServices')}
          count={myServices.length}
        />
        <TabButton
          active={activeTab === TABS.MY_BOOKINGS}
          onClick={() => setActiveTab(TABS.MY_BOOKINGS)}
          icon={<FaBookmark />}
          label={t('services.myBookings')}
          count={myBookings.length}
        />
        <TabButton
          active={activeTab === TABS.RECEIVED}
          onClick={() => setActiveTab(TABS.RECEIVED)}
          icon={<FaCalendarCheck />}
          label={t('services.receivedBookings')}
          count={receivedBookings.length}
        />
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-2">
          <Button
            text={t('services.addService')}
            bgColor="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
            textColor="text-white"
            handler={() => setIsAddModalOpen(true)}
            icon={<FaPlus className="mr-2" />}
            className="shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/40"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700">
          <FaMapMarkerAlt className="text-[var(--color-primary)]" />
          <span>{filterCity !== 'الكل' ? filterCity : t('services.allCities')}</span>
          <span className="mx-1">•</span>
          <span>{filterCategory !== 'الكل' ? categories.find(c => c.id === parseInt(filterCategory))?.name : t('services.allCategories')}</span>
        </div>
      </div>

      <ServiceFilters cities={cities} categories={categories} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonServiceCard key={i} />
          ))}
        </div>
      ) : !hasServices && activeTab === TABS.ALL ? (
        <div className="text-center py-16 animate-fade-up">
          <div className="flex justify-center text-5xl mb-4 text-gray-400">
            <FaInbox />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
            {t('services.noServicesAvailable', 'لا توجد خدمات متاحة حالياً')}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {t('services.noServicesHint')}
          </p>
          <Button
            text={t('services.addService')}
            bgColor="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
            textColor="text-white"
            handler={() => setIsAddModalOpen(true)}
            icon={<FaPlus className="mr-2" />}
            className="shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/40"
          />
        </div>
      ) : (
        renderContent()
      )}

      <AddServiceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {selectedService && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => { setIsBookingModalOpen(false); setSelectedService(null); }}
          serviceId={selectedService.id}
          serviceName={selectedService.name}
          initialLocation={selectedService.bookingLocation}
        />
      )}
    </div>
  );
};

// ── TabButton ──
const TabButton = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all duration-200 border-b-2 hover:scale-105 ${
      active
        ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
    }`}
  >
    {icon}
    {label}
    {count !== undefined && count > 0 && (
      <span className={`text-xs px-2 py-0.5 rounded-full ${
        active ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
      }`}>
        {count}
      </span>
    )}
  </button>
);

// ── Booking Card ──
const BookingCard = ({ booking, index }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [completing, setCompleting] = useState(false);
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  };

  const handleComplete = async () => {
    confirmToast(t('services.confirmComplete'), async () => {
      setCompleting(true);
      try {
        await dispatch(completeBooking(booking.id)).unwrap();
        showSuccess(t('services.bookingCompleted'));
        await dispatch(fetchMyBookings());
        await dispatch(fetchReceivedBookings());
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (err) {
        showError(err || t('services.bookingCompleteError'));
      }
      setCompleting(false);
    });
  };

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={index * 50}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 border border-gray-100 dark:border-gray-700 hover:-translate-y-0.5"
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white">{booking.service?.name || t('services.unknownService')}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('services.requestedAt')}: {new Date(booking.created_at).toLocaleDateString('ar-EG')}
          </p>
          {booking.scheduled_at && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('services.scheduledAt')}: {new Date(booking.scheduled_at).toLocaleString('ar-EG')}
            </p>
          )}
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${statusColors[booking.status] || 'bg-gray-100'}`}>
          {t(`services.status_${booking.status}`) || booking.status}
        </span>
      </div>
      {booking.rejection_reason && (
        <p className="text-sm text-red-500 mt-2">{t('services.rejectionReason')}: {booking.rejection_reason}</p>
      )}
      {booking.status === 'approved' && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <Button
            text={completing ? t('common.loading') : t('services.completeBooking')}
            bgColor="bg-blue-500 hover:bg-blue-600"
            textColor="text-white"
            handler={handleComplete}
            disabled={completing}
            className="w-full shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/30"
          />
        </div>
      )}
    </div>
  );
};

// ── Received Booking Card ──
const ReceivedBookingCard = ({ booking, index }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await dispatch(approveBooking(booking.id)).unwrap();
      showSuccess(t('services.bookingApproved'));
      dispatch(fetchReceivedBookings());
    } catch (err) {
      showError(err || t('services.bookingApproveError'));
    }
    setLoading(false);
  };

  const handleReject = async () => {
    const reason = prompt(t('services.enterRejectionReason'));
    if (reason === null) return;
    setLoading(true);
    try {
      await dispatch(rejectBooking({ bookingId: booking.id, reason })).unwrap();
      showSuccess(t('services.bookingRejected'));
      dispatch(fetchReceivedBookings());
    } catch (err) {
      showError(err || t('services.bookingRejectError'));
    }
    setLoading(false);
  };

  const requesterName = booking.user?.name || booking.user_id || t('services.unknownUser');

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={index * 50}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 border border-gray-100 dark:border-gray-700 hover:-translate-y-0.5"
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white">{booking.service?.name || t('services.unknownService')}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('services.requestedBy')}: {requesterName}
          </p>
          {booking.scheduled_at && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('services.scheduledAt')}: {new Date(booking.scheduled_at).toLocaleString('ar-EG')}
            </p>
          )}
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${
          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          booking.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          booking.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100'
        }`}>
          {t(`services.status_${booking.status}`) || booking.status}
        </span>
      </div>

      {booking.status === 'pending' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <Button
            text={loading ? t('common.loading') : t('services.approve')}
            bgColor="bg-green-500 hover:bg-green-600"
            textColor="text-white"
            handler={handleApprove}
            disabled={loading}
            className="flex-1 shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/30"
          />
          <Button
            text={loading ? t('common.loading') : t('services.reject')}
            bgColor="bg-red-500 hover:bg-red-600"
            textColor="text-white"
            handler={handleReject}
            disabled={loading}
            className="flex-1 shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/30"
          />
        </div>
      )}
    </div>
  );
};

export default ServicesPage;