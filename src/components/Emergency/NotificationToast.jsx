import React, { useCallback, useEffect, useRef, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markNotificationRead } from './../../redux/slices/emergencySlice';
import { useEmergencyNotifications } from '../../hooks/useEmergencyNotifications';
import { FaPeriscope } from "react-icons/fa6";
import { FaMagnifyingGlass } from "react-icons/fa6";

const SEVERITY_COLORS = {
  severe: 'border-red-500 bg-red-50 dark:bg-red-950/30',
  moderate: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30',
  mild: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
};

const NotificationToast = memo(() => {
  const dispatch = useDispatch();
  const notifications = useSelector(state => state.emergency.notifications);
  const currentUser = useSelector(state => state.user.currentUser);
  const { acceptEmergency, rejectEmergency } = useEmergencyNotifications();

  // Use a ref for visible state to avoid triggering re-renders in the effect
  const visibleRef = useRef({});
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const timersRef = useRef({});

  const userId = currentUser?.id ?? 'user_123';

  const dismiss = useCallback((notifId) => {
    visibleRef.current[notifId] = false;
    dispatch(markNotificationRead(notifId));
    forceUpdate();
  }, [dispatch]);

  useEffect(() => {
    const userNotifs = notifications.filter(n => n.userId === userId && !n.read);
    let changed = false;

    userNotifs.forEach(notif => {
      if (!visibleRef.current[notif.id]) {
        visibleRef.current[notif.id] = true;
        changed = true;

        if (!timersRef.current[notif.id]) {
          timersRef.current[notif.id] = setTimeout(() => {
            dismiss(notif.id);
            delete timersRef.current[notif.id];
          }, 10_000);
        }
      }
    });

    if (changed) forceUpdate();

    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, [notifications, userId, dismiss]);

  const visibleNotifs = notifications.filter(
    n => n.userId === userId && visibleRef.current[n.id]
  );

  if (visibleNotifs.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 end-5 z-50 flex flex-col gap-3 max-h-[80vh] overflow-y-auto"
      role="region"
      aria-label="الإشعارات"
      aria-live="polite"
    >
      {visibleNotifs.map(notif => (
        <div
          key={notif.id}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 w-80 border-s-4 ${
            SEVERITY_COLORS[notif.severity] ?? SEVERITY_COLORS.mild
          } animate-slide-in`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0" aria-hidden="true">🚨</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-800 dark:text-white text-sm">{notif.title}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{notif.message}</p>
              {notif.location && (
                <p className="text-xs text-gray-400 mt-1">
                  <FaPeriscope /> {notif.location[0]?.toFixed(4)}, {notif.location[1]?.toFixed(4)}
                </p>
              )}
              {notif.type === 'SOS' && notif.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={async () => {
                      await acceptEmergency(notif.emergencyId, userId);
                      dismiss(notif.id);
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  >
                    ✅ أقبل
                  </button>
                  <button
                    onClick={async () => {
                      await rejectEmergency(notif.emergencyId, userId);
                      dismiss(notif.id);
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  >
                    ❌ أرفض
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => dismiss(notif.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0 p-1"
              aria-label="إغلاق الإشعار"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});

NotificationToast.displayName = 'NotificationToast';
export default NotificationToast;