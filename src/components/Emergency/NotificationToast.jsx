import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification, markNotificationRead } from './../../redux/slices/emergencySlice';
import { useEmergencyNotifications } from '../../hooks/useEmergencyNotifications';

const NotificationToast = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector(state => state.emergency);
  const { currentUser } = useSelector(state => state.user);
  const { acceptEmergency, rejectEmergency } = useEmergencyNotifications();
  const [visible, setVisible] = useState({});

  useEffect(() => {
    // عرض الإشعارات الجديدة
    const userId = currentUser?.id || 'user_123';
    const userNotifications = notifications.filter(n => n.userId === userId && !n.read);
    
    userNotifications.forEach(notif => {
      if (!visible[notif.id]) {
        setVisible(prev => ({ ...prev, [notif.id]: true }));
        
        // إخفاء الإشعار تلقائياً بعد 10 ثوانٍ إذا لم يتم التفاعل
        setTimeout(() => {
          setVisible(prev => ({ ...prev, [notif.id]: false }));
          dispatch(markNotificationRead(notif.id));
        }, 10000);
      }
    });
  }, [notifications, currentUser, dispatch, visible]);

  const handleAccept = async (notif) => {
    await acceptEmergency(notif.emergencyId, currentUser?.id || 'user_123');
    setVisible(prev => ({ ...prev, [notif.id]: false }));
    dispatch(markNotificationRead(notif.id));
    // هنا يمكن إضافة توجيه إلى الخريطة أو فتح شات الطوارئ
  };

  const handleReject = async (notif) => {
    await rejectEmergency(notif.emergencyId, currentUser?.id || 'user_123');
    setVisible(prev => ({ ...prev, [notif.id]: false }));
    dispatch(markNotificationRead(notif.id));
  };

  const userId = currentUser?.id || 'user_123';
  const userNotifications = notifications.filter(n => n.userId === userId && visible[n.id]);

  if (userNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-3">
      {userNotifications.map(notif => (
        <div
          key={notif.id}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-sm border-r-4 ${
            notif.severity === 'severe' ? 'border-red-500' : 
            notif.severity === 'moderate' ? 'border-orange-500' : 'border-yellow-500'
          } animate-slide-in`}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">🚨</div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 dark:text-white">{notif.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notif.message}</p>
              {notif.location && (
                <p className="text-xs text-gray-400 mt-1">📍 موقع: {notif.location[0]?.toFixed(4)}, {notif.location[1]?.toFixed(4)}</p>
              )}
              {notif.type === 'SOS' && notif.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAccept(notif)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-full text-sm transition"
                  >
                    ✅ أقبل
                  </button>
                  <button
                    onClick={() => handleReject(notif)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-full text-sm transition"
                  >
                    ❌ أرفض
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setVisible(prev => ({ ...prev, [notif.id]: false }));
                dispatch(markNotificationRead(notif.id));
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;