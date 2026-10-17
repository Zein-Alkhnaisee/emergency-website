// src/components/Services/BookingModal.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';
import { bookService } from '../../redux/slices/servicesSlice';
import { showSuccess, showError } from '../../utils/toastHelpers';
import Button from '../Shared/Button';
import LocationPickerMap from '../Profile/LocationPickerMap';

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

const BookingModal = ({ isOpen, onClose, serviceId, serviceName, initialLocation = null }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    latitude: '',
    longitude: '',
    city: '',
    notes: '',
    scheduled_at: '',
  });
  const [mapLocation, setMapLocation] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialLocation) {
        const { latitude, longitude } = initialLocation;
        setForm(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        }));
        setMapLocation([latitude, longitude]);
        fetchAddressFromCoords(latitude, longitude).then(({ city }) => {
          setForm(prev => ({ ...prev, city: city || '' }));
        });
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = [pos.coords.latitude, pos.coords.longitude];
            setMapLocation(coords);
            setForm(prev => ({
              ...prev,
              latitude: coords[0].toString(),
              longitude: coords[1].toString(),
            }));
            fetchAddressFromCoords(coords[0], coords[1]).then(({ city }) => {
              setForm(prev => ({ ...prev, city: city || '' }));
            });
          },
          () => { }
        );
      }
    }
  }, [isOpen, initialLocation]);

  const handleMapSelect = async (coords) => {
    setForm(prev => ({
      ...prev,
      latitude: coords[0].toString(),
      longitude: coords[1].toString(),
    }));
    const { city } = await fetchAddressFromCoords(coords[0], coords[1]);
    setForm(prev => ({ ...prev, city: city || '' }));
    setMapLocation(coords);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      showError(t('services.locationRequired'));
      return;
    }
    setLoading(true);
    const bookingData = {
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      city: form.city,
      notes: form.notes,
      scheduled_at: form.scheduled_at || undefined,
    };
    const result = await dispatch(bookService({ serviceId, bookingData }));
    setLoading(false);
    if (bookService.fulfilled.match(result)) {
      showSuccess(t('services.bookingSent'));
      onClose();
    } else {
      showError(result.payload);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[95vh] flex flex-col shadow-2xl border border-white/10 dark:border-gray-700/50 animate-slide-in-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('services.bookNow')} - {serviceName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 hover:rotate-90"><FaTimes /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('services.selectLocation')}</label>
              <div className="h-32 md:h-40 rounded-xl overflow-hidden mb-2 shadow-inner">
                <LocationPickerMap
                  initialLocation={mapLocation}
                  onLocationSelect={handleMapSelect}
                  height="100%"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('services.mapHint')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('services.latitude')} *</label>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={e => setForm({ ...form, latitude: e.target.value })}
                className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('services.longitude')} *</label>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={e => setForm({ ...form, longitude: e.target.value })}
                className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('services.city')}</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('services.scheduledAt')}</label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
                className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('services.notes')}</label>
              <textarea
                rows="3"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>
            {/* ✅ أزرار مودال الحجز - متوافقة مع الثيم الديناميكي */}
            <div className="flex gap-3 justify-end pt-2 shrink-0">
              <Button
                text={t('common.cancel')}
                bgColor="bg-gray-100 dark:bg-gray-700"
                textColor="text-gray-700 dark:text-gray-300"
                handler={onClose}
              />
              <Button
                type="submit"
                text={loading ? t('common.loading') : t('services.sendRequest')}
                bgColor="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
                textColor="text-white"
                disabled={loading}
                className="shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/40"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;