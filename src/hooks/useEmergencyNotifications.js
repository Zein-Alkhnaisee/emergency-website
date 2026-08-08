import { useDispatch } from 'react-redux';
import { respondToNotification } from '../redux/slices/emergencyNotificationsSlice';
import { showSuccess, showError } from '../utils/toastHelpers';

export const useEmergencyNotifications = () => {
  const dispatch = useDispatch();

  const acceptEmergency = async (notifId) => {
    try {
      const result = await dispatch(respondToNotification({ notifId, response: 'accepted' })).unwrap();
      showSuccess('✅ تم قبول المشاركة في حالة الطوارئ');
      return result;
    } catch (err) {
      showError(err || 'فشل قبول الحالة');
      throw err;
    }
  };

  const rejectEmergency = async (notifId) => {
    try {
      const result = await dispatch(respondToNotification({ notifId, response: 'rejected' })).unwrap();
      showSuccess('❌ تم رفض المشاركة في حالة الطوارئ');
      return result;
    } catch (err) {
      showError(err || 'فشل رفض الحالة');
      throw err;
    }
  };

  return { acceptEmergency, rejectEmergency };
};