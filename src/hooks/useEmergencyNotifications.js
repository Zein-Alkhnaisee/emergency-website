// src/hooks/useEmergencyNotifications.js
import { useDispatch } from 'react-redux';
import { acceptRescueWithTracking } from '../redux/slices/trackingSlice';
import { rejectRescueRequest } from '../redux/slices/rescueRequestsSlice';
import { showSuccess, showError } from '../utils/toastHelpers';

export const useEmergencyNotifications = () => {
  const dispatch = useDispatch();

  // دالة جلب الموقع الحالي
  const getCurrentPosition = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy_m: pos.coords.accuracy || 10,
            recorded_at: new Date().toISOString(),
          });
        },
        (err) => {
          console.warn('Geolocation error:', err);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    });
  };

  const acceptEmergency = async (emergencyId) => {
    try {
      // جلب الموقع الحالي (قد يكون null إذا فشل)
      const originData = await getCurrentPosition();
      const result = await dispatch(acceptRescueWithTracking({
        emergencyId,
        originData,
      })).unwrap();
      showSuccess('✅ تم قبول المشاركة في حالة الطوارئ');
      return result;
    } catch (err) {
      showError(err || 'فشل قبول الحالة');
      throw err;
    }
  };

  const rejectEmergency = async (emergencyId) => {
    try {
      const result = await dispatch(rejectRescueRequest(emergencyId)).unwrap();
      showSuccess('❌ تم رفض المشاركة في حالة الطوارئ');
      return result;
    } catch (err) {
      showError(err || 'فشل رفض الحالة');
      throw err;
    }
  };

  return { acceptEmergency, rejectEmergency };
};