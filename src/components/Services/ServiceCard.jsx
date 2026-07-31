// src/components/Services/ServiceCard.jsx
import React, { memo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { 
  FaMapMarkerAlt, FaPhone, FaClock, FaStar, FaRegStar, FaStarHalfAlt, 
  FaCheckCircle, FaRuler, FaCalendarPlus, FaStar as FaStarIcon 
} from 'react-icons/fa';
import Button from '../Shared/Button';
import RateServiceModal from './RateServiceModal';

const ServiceCard = memo(({ service, index, onBook, showDistance = false }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useSelector(s => s.user);
  const myBookings = useSelector(s => s.services.myBookings);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isBookedAndCompleted, setIsBookedAndCompleted] = useState(false);
  const [completedBookingGroupId, setCompletedBookingGroupId] = useState(null);

  useEffect(() => {
    if (!myBookings || myBookings.length === 0) {
      setIsBookedAndCompleted(false);
      setCompletedBookingGroupId(null);
      return;
    }

    const serviceIdNum = Number(service.id);
    const completedBooking = myBookings.find(b => 
      Number(b.service_id || b.service?.id || b.serviceId || b.delivery_location?.service_id) === serviceIdNum &&
      b.status?.toLowerCase() === 'completed'
    );

    if (completedBooking) {
      setIsBookedAndCompleted(true);
      // استخراج group_id من الحجز
      const groupId = completedBooking.group_id || completedBooking.group?.id || null;
      setCompletedBookingGroupId(groupId);
    } else {
      setIsBookedAndCompleted(false);
      setCompletedBookingGroupId(null);
    }
  }, [myBookings, service.id]);

  const renderStars = (rating) => {
    const full = Math.floor(rating || 0);
    const half = (rating || 0) % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <>
        {[...Array(full)].map((_, i) => <FaStar key={i} className="text-yellow-400 text-sm" />)}
        {half && <FaStarHalfAlt className="text-yellow-400 text-sm" />}
        {[...Array(empty)].map((_, i) => <FaRegStar key={i} className="text-gray-300 dark:text-gray-500 text-sm" />)}
      </>
    );
  };

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
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-primary transition line-clamp-1">
              {service.name}
            </h3>
            <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
              {service.category?.name || service.category_name || t('services.uncategorized')}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            {renderStars(service.average_rating || service.rating || 0)}
            <span className="text-xs text-gray-500">({service.ratings_count || 0})</span>
            {isVerified && <FaCheckCircle className="text-green-500 text-xs" title={t('services.verified')} />}
          </div>

          {showDistance && service.distance !== undefined && service.distance !== null && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
              <FaRuler className="text-primary" />
              <span>{service.distance.toFixed(1)} {t('services.km')}</span>
            </div>
          )}

          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300 mb-2">
            <FaMapMarkerAlt className="text-primary mt-0.5 shrink-0" />
            <span className="text-sm">{service.city}{service.address ? `, ${service.address}` : ''}</span>
          </div>

          {service.contact_phone && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
              <FaPhone className="text-green-500 shrink-0" />
              <a href={`tel:${service.contact_phone}`} className="text-sm hover:text-primary transition">
                {service.contact_phone}
              </a>
            </div>
          )}

          {service.availability && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-4">
              <FaClock className="shrink-0" />
              <span>{t('services.available')}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button
              text={t('services.bookNow')}
              bgColor="bg-primary"
              textColor="text-white"
              handler={onBook}
              className="flex-1 min-w-[100px]"
              icon={<FaCalendarPlus className="mr-1" />}
            />

            {/* زر التقييم يظهر فقط إذا كان المستخدم مسجلًا ولديه حجز مكتمل لهذه الخدمة */}
            {isAuthenticated && isBookedAndCompleted && completedBookingGroupId && (
              <Button
                text={t('services.rateService')}
                bgColor="bg-yellow-500 hover:bg-yellow-600"
                textColor="text-white"
                handler={() => {
                  setShowRatingModal(true);
                }}
                className="flex-1 min-w-[100px]"
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

      {showRatingModal && completedBookingGroupId && (
        <RateServiceModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          serviceId={service.id}
          serviceName={service.name}
          groupId={Number(completedBookingGroupId)}
        />
      )}
    </>
  );
});

ServiceCard.displayName = 'ServiceCard';
export default ServiceCard;