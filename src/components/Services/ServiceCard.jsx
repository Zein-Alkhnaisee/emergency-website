import React, { memo, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ReportModal from '../Reports/ReportModal';
import {
  FaMapMarkerAlt, FaPhone, FaClock, FaStar, FaRegStar, FaStarHalfAlt,
  FaCheckCircle, FaRuler, FaCalendarPlus, FaStar as FaStarIcon,
  FaFlag
} from 'react-icons/fa';
import Button from '../Shared/Button';
import RateServiceModal from './RateServiceModal';

// ── StarRating (مُحسَّن) ──
const StarRating = memo(({ rating }) => {
  
  const full = Math.floor(rating || 0);
  const half = (rating || 0) % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <>
      {[...Array(full)].map((_, i) => <FaStar key={`full-${i}`} className="text-yellow-400 text-sm" />)}
      {half && <FaStarHalfAlt key="half" className="text-yellow-400 text-sm" />}
      {[...Array(empty)].map((_, i) => <FaRegStar key={`empty-${i}`} className="text-gray-300 dark:text-gray-500 text-sm" />)}
    </>
  );
});
StarRating.displayName = 'StarRating';

// ── Service Card ──
const ServiceCard = memo(({ service, index, onBook, showDistance = false }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useSelector(s => s.user);
  const myBookings = useSelector(s => s.services.myBookings);
  const [showReportModal, setShowReportModal] = useState(false);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isBookedAndCompleted, setIsBookedAndCompleted] = useState(false);
  const [completedBookingGroupId, setCompletedBookingGroupId] = useState(null);

  // استخدام useMemo لتجنب إعادة الحساب في كل ريندر
  const serviceIdNum = React.useMemo(() => Number(service.id), [service.id]);

  // التحقق من وجود حجز مكتمل
  useEffect(() => {
    if (!myBookings || myBookings.length === 0) {
      setIsBookedAndCompleted(false);
      setCompletedBookingGroupId(null);
      return;
    }

    const completedBooking = myBookings.find(b =>
      Number(b.service_id || b.service?.id || b.serviceId || b.delivery_location?.service_id) === serviceIdNum &&
      b.status?.toLowerCase() === 'completed'
    );

    if (completedBooking) {
      setIsBookedAndCompleted(true);
      const groupId = completedBooking.group_id || completedBooking.group?.id || null;
      setCompletedBookingGroupId(groupId);
    } else {
      setIsBookedAndCompleted(false);
      setCompletedBookingGroupId(null);
    }
  }, [myBookings, serviceIdNum]);

  // استخدام useCallback لمنع إعادة إنشاء الدوال
  const handleBookClick = useCallback(() => {
    if (onBook) onBook();
  }, [onBook]);

  const handleRateClick = useCallback(() => {
    setShowRatingModal(true);
  }, []);

  const handleCloseRatingModal = useCallback(() => {
    setShowRatingModal(false);
  }, []);
  console.log('Service object:', service);

  const isVerified = service.is_verified || service.status === 'approved';

  return (
    <>
      <div
        data-aos="fade-up"
        data-aos-duration="500"
        data-aos-delay={index * 60}
        className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:-translate-y-1"
      >
        <div className="p-5">
          {/* ── العنوان والتصنيف ── */}
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-primary transition-colors duration-200 line-clamp-1">
              {service.name}
            </h3>
            <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
              {service.category?.name || service.category_name || t('services.uncategorized')}
            </span>
          </div>

          {/* ── التقييم ── */}
          <div className="flex items-center gap-2 mb-3">
            <StarRating rating={service.average_rating || service.rating || 0} />
            <span className="text-xs text-gray-500 dark:text-gray-400">({service.ratings_count || 0})</span>
            {isVerified && <FaCheckCircle className="text-green-500 text-xs" title={t('services.verified')} />}
          </div>

          {/* ── المسافة ── */}
          {showDistance && service.distance !== undefined && service.distance !== null && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <FaRuler className="text-primary" />
              <span>{service.distance.toFixed(1)} {t('services.km')}</span>
            </div>
          )}

          {/* ── الموقع ── */}
          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300 mb-2">
            <FaMapMarkerAlt className="text-primary mt-0.5 shrink-0" />
            <span className="text-sm">{service.city}{service.address ? `, ${service.address}` : ''}</span>
          </div>

          {/* ── الهاتف ── */}
          {service.contact_phone && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
              <FaPhone className="text-green-500 shrink-0" />
              <a href={`tel:${service.contact_phone}`} className="text-sm hover:text-primary transition-colors duration-200">
                {service.contact_phone}
              </a>
            </div>
          )}

          {/* ── التوفر ── */}
          {service.availability && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-4">
              <FaClock className="shrink-0" />
              <span>{t('services.available')}</span>
            </div>
          )}

          {/* ── الأزرار ── */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button
              text={t('services.bookNow')}
              bgColor="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
              textColor="text-white"
              handler={onBook}
              className="flex-1 min-w-[100px] shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/40"
              icon={<FaCalendarPlus className="mr-1" />}
            />

            <button
              onClick={() => setShowReportModal(true)}
              className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-200 flex items-center gap-1"
            >
              <FaFlag className="text-xs" />
              {t('services.report')}
            </button>
            {isAuthenticated && isBookedAndCompleted && completedBookingGroupId && (
              <Button
                text={t('services.rateService')}
                bgColor="bg-yellow-500 hover:bg-yellow-600"
                textColor="text-white"
                handler={() => { setShowRatingModal(true); }}
                className="flex-1 min-w-[100px] shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/40"
                icon={<FaStarIcon className="mr-1" />}
              />
            )}

            {service.status === 'pending' && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full flex items-center">
                {t('services.pending')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── مودال التقييم ── */}
      {showRatingModal && completedBookingGroupId && (
        <RateServiceModal
          isOpen={showRatingModal}
          onClose={handleCloseRatingModal}
          serviceId={service.id}
          serviceName={service.name}
          groupId={Number(completedBookingGroupId)}
        />
      )}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedId={service?.user?.id || service?.user_id || service?.provider?.id || service?.provider_id || service?.owner_id || service?.user?.userId}
        reportedName={service?.user?.name || service?.user?.display_name || service?.provider?.name || service?.provider_name || t('services.unknownUser')}
        serviceId={service?.id}
      />
    </>
  );
});

ServiceCard.displayName = 'ServiceCard';
export default ServiceCard;