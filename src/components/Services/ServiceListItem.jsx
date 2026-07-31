// src/components/Services/ServiceListItem.jsx
import React, { memo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { 
  FaMapMarkerAlt, FaPhone, FaClock, FaDollarSign, 
  FaCheckCircle, FaEdit, FaTrash, FaRuler,
  FaCalendarCheck, FaStar, FaRegStar, FaStarHalfAlt
} from 'react-icons/fa';
import { updateService, deleteService, reportProvider } from '../../redux/slices/servicesSlice';
import { showSuccess, showError, confirmToast } from '../../utils/toastHelpers';
import Button from '../Shared/Button';

const ServiceListItem = memo(({ service, index, isMyService = false }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: service.name || '',
    city: service.city || '',
    contact_phone: service.contact_phone || '',
  });

  const renderStars = (rating) => {
    const full = Math.floor(rating || 0);
    const half = (rating || 0) % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <>
        {[...Array(full)].map((_, i) => <FaStar key={i} className="text-yellow-400 text-sm" />)}
        {half && <FaStarHalfAlt className="text-yellow-400 text-sm" />}
        {[...Array(empty)].map((_, i) => <FaRegStar key={i} className="text-gray-300 text-sm" />)}
      </>
    );
  };

  const handleEdit = async () => {
    const formData = new FormData();
    formData.append('name', editForm.name);
    formData.append('city', editForm.city);
    if (editForm.contact_phone) formData.append('contact_phone', editForm.contact_phone);
    
    const result = await dispatch(updateService({ serviceId: service.id, formData }));
    if (updateService.fulfilled.match(result)) {
      showSuccess(t('services.updateSuccess'));
      setIsEditing(false);
    } else {
      showError(result.payload);
    }
  };

  const handleDelete = () => {
    confirmToast(t('services.confirmDelete'), async () => {
      const result = await dispatch(deleteService(service.id));
      if (deleteService.fulfilled.match(result)) {
        showSuccess(t('services.deleteSuccess'));
      } else {
        showError(result.payload);
      }
    });
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const statusLabels = {
    pending: t('services.status_pending'),
    approved: t('services.status_approved'),
    rejected: t('services.status_rejected'),
  };

  return (
    <div
      data-aos="fade-up"
      data-aos-duration="500"
      data-aos-delay={index * 50}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* الأيقونة */}
        <div className="text-3xl bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
          🛠️
        </div>

        {/* المعلومات */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 text-sm"
                placeholder={t('services.serviceName')}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="flex-1 p-2 border rounded dark:bg-gray-700 text-sm"
                  placeholder={t('services.city')}
                />
                <input
                  type="tel"
                  value={editForm.contact_phone}
                  onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                  className="flex-1 p-2 border rounded dark:bg-gray-700 text-sm"
                  placeholder={t('services.contactPhone')}
                />
              </div>
              <div className="flex gap-2">
                <Button text={t('common.save')} bgColor="bg-primary" textColor="text-white" handler={handleEdit} />
                <Button text={t('common.cancel')} bgColor="bg-gray-500" textColor="text-white" handler={() => setIsEditing(false)} />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{service.name}</h3>
                {service.is_verified && (
                  <FaCheckCircle className="text-green-500" title={t('services.verified')} />
                )}
                {service.status && service.status !== 'approved' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[service.status] || 'bg-gray-100'}`}>
                    {statusLabels[service.status] || service.status}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <FaMapMarkerAlt className="text-primary" /> {service.city}
                </span>
                {service.contact_phone && (
                  <span className="flex items-center gap-1">
                    <FaPhone className="text-green-500" /> {service.contact_phone}
                  </span>
                )}
                {service.distance !== undefined && (
                  <span className="flex items-center gap-1">
                    <FaRuler className="text-primary" /> {service.distance.toFixed(1)} {t('services.km')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  {renderStars(service.average_rating || 0)} ({service.ratings_count || 0})
                </span>
              </div>
            </>
          )}
        </div>

        {/* الإجراءات */}
        {isMyService && !isEditing && (
          <div className="flex gap-2">
            {service.status === 'pending' && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg hover:bg-blue-200 transition"
              >
                <FaEdit />
              </button>
            )}
            {(service.status === 'pending' || service.status === 'rejected') && (
              <button
                onClick={handleDelete}
                className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-200 transition"
              >
                <FaTrash />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

ServiceListItem.displayName = 'ServiceListItem';
export default ServiceListItem;