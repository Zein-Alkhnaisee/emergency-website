// src/pages/ServicesPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FaPlus, FaMapMarkerAlt, FaList,
  FaBookmark, FaUserCog, FaCalendarCheck,
  FaSearchLocation, FaCheckCircle, FaTimesCircle,
  FaCrosshairs
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
  const { currentUser, isAuthenticated } = useSelector(s => s.user);
  const [activeTab, setActiveTab] = useState(TABS.ALL);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [nearbyLocation, setNearbyLocation] = useState(null);
  const [nearbyMapLocation, setNearbyMapLocation] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // جلب موقع المستخدم عند التحميل (مرة واحدة)
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
          const defaultLoc = { latitude: 33.5138, longitude: 36.2765 };
          setNearbyLocation(defaultLoc);
          setNearbyMapLocation([defaultLoc.latitude, defaultLoc.longitude]);
        }
      );
    }
  }, [isAuthenticated]);

  // جلب البيانات الأساسية
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchHomeServices());
      dispatch(fetchCategories());
      dispatch(fetchCities());
      dispatch(fetchMyServices());
      dispatch(fetchMyBookings());
      dispatch(fetchReceivedBookings());
    }
  }, [dispatch, isAuthenticated]);

  // جلب الخدمات القريبة عند تغيير الموقع أو التبديل إلى التبويب
  useEffect(() => {
    if (activeTab === TABS.NEARBY && nearbyLocation) {
      setNearbyLoading(true);
      dispatch(fetchNearbyServices({
        latitude: nearbyLocation.latitude,
        longitude: nearbyLocation.longitude,
      })).finally(() => setNearbyLoading(false));
    } else if (activeTab !== TABS.NEARBY) {
      dispatch(clearNearbyServices());
    }
  }, [activeTab, nearbyLocation, dispatch]);

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

  const renderContent = () => {
    switch (activeTab) {
      case TABS.NEARBY:
        return (
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                  {t('services.selectLocationOnMap')}
                </h4>
                <button
                  onClick={handleUseCurrentLocation}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FaCrosshairs /> {t('services.useMyLocation')}
                </button>
              </div>
              <div className="h-52 rounded-xl overflow-hidden">
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
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : nearbyServices.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
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
          <div className="space-y-4">
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
          <div className="space-y-4">
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
          <div className="space-y-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

  if (!isAuthenticated) {
    return (
      <div className="container my-10 text-center">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 p-8 rounded-2xl">
          <p className="text-yellow-700 dark:text-yellow-300 text-lg">
            {t('services.loginRequired')}
          </p>
          <Button
            text={t('login')}
            bgColor="bg-primary"
            textColor="text-white"
            handler={() => navigate('/login')}
            className="mt-4"
          />
        </div>
      </div>
    );
  }

  return (
    <div id="services" className="container my-10 scroll-mt-20">
      <Heading title={t('services.title')} subtitle={t('services.subtitle')} />

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <TabButton
          active={activeTab === TABS.ALL}
          onClick={() => setActiveTab(TABS.ALL)}
          icon={<FaList />}
          label={t('services.allServices')}
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
            bgColor="bg-secondary"
            textColor="text-white"
            handler={() => setIsAddModalOpen(true)}
            icon={<FaPlus className="mr-2" />}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FaMapMarkerAlt className="text-primary" />
          <span>{filterCity !== 'الكل' ? filterCity : t('services.allCities')}</span>
          <span className="mx-1">•</span>
          <span>{filterCategory !== 'الكل' ? categories.find(c => c.id === parseInt(filterCategory))?.name : t('services.allCategories')}</span>
        </div>
      </div>

      <ServiceFilters cities={cities} categories={categories} />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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

const TabButton = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all border-b-2 ${
      active
        ? 'border-primary text-primary bg-primary/5'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
    }`}
  >
    {icon}
    {label}
    {count !== undefined && count > 0 && (
      <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-primary/15 text-primary' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
        {count}
      </span>
    )}
  </button>
);

// ── Booking Card (لمستخدم الطلب) ──────────────────────────────
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
        // ✅ تحديث الحجوزات فورًا
        await dispatch(fetchMyBookings());
        await dispatch(fetchReceivedBookings());
        // ✅ تحديث الصفحة لضمان ظهور زر التقييم
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
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{booking.service?.name || t('services.unknownService')}</h4>
          <p className="text-sm text-gray-500">
            {t('services.requestedAt')}: {new Date(booking.created_at).toLocaleDateString('ar-EG')}
          </p>
          {booking.scheduled_at && (
            <p className="text-sm text-gray-500">
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
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

// ── Received Booking Card (لمقدم الخدمة) ──────────────────────
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
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{booking.service?.name || t('services.unknownService')}</h4>
          <p className="text-sm text-gray-500">
            {t('services.requestedBy')}: {requesterName}
          </p>
          {booking.scheduled_at && (
            <p className="text-sm text-gray-500">
              {t('services.scheduledAt')}: {new Date(booking.scheduled_at).toLocaleString('ar-EG')}
            </p>
          )}
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${
          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          booking.status === 'approved' ? 'bg-green-100 text-green-700' :
          booking.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
        }`}>
          {t(`services.status_${booking.status}`) || booking.status}
        </span>
      </div>

      {booking.status === 'pending' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <Button
            text={loading ? t('common.loading') : t('services.approve')}
            bgColor="bg-green-500"
            textColor="text-white"
            handler={handleApprove}
            disabled={loading}
            className="flex-1"
          />
          <Button
            text={loading ? t('common.loading') : t('services.reject')}
            bgColor="bg-red-500"
            textColor="text-white"
            handler={handleReject}
            disabled={loading}
            className="flex-1"
          />
        </div>
      )}
    </div>
  );
};

export default ServicesPage;