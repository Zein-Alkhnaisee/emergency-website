// src/components/Notifications/LiveNotificationCenter.jsx
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaFire, FaCar, FaHeartbeat, FaExclamationTriangle,
  FaStar, FaBell, FaTimes, FaClock, FaCheck, FaMapMarkerAlt,
} from 'react-icons/fa';
import { fetchMyNotifications } from '../../redux/slices/emergencyNotificationsSlice';
import { fetchNotifications as fetchUserNotifications } from '../../redux/slices/trustSlice';
import { fetchAllNotifications } from '../../redux/slices/notificationsSlice';
import {
  fetchUserNotifications as fetchUserNotificationsV2,
  addNotificationRealtime,
  setUnreadCount,
} from '../../redux/slices/rescueRequestsSlice';
// ✅ NEW: initEcho مضاف هون — هاد الكومبوننت هلق هو المسؤول عن تجهيز الاتصال
import { initEcho, getEcho, subscribeToUserNotificationsV2 } from '../../services/echo';
import { useEmergencyNotifications } from '../../hooks/useEmergencyNotifications';

const TOAST_DURATION_MS = 15000;
const MAX_VISIBLE_TOASTS = 4;
const EMERGENCY_POLL_MS = 20000;
const USER_NOTIF_POLL_MS = 25000;
const SEEN_IDS_CAP = 300;
// ✅ NEW: كم مرة نحاول نعيد الاشتراك لحد ما echo يجهز
const ECHO_RETRY_MS = 1000;
const ECHO_RETRY_MAX_ATTEMPTS = 15; // ~15 ثانية كحد أقصى

// ── أيقونات وتسميات حالات الطوارئ ─────────────────────────────
const CASE_ICON = {
  fire: <FaFire className="text-red-400" />,
  accident: <FaCar className="text-orange-400" />,
  medical: <FaHeartbeat className="text-pink-400" />,
  other: <FaExclamationTriangle className="text-yellow-400" />,
};
const CASE_LABEL_AR = {
  fire: 'حريق',
  accident: 'حادث',
  medical: 'حالة طبية',
  other: 'حالة طوارئ',
};
const SEVERITY_LABEL_AR = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
};
const SEVERITY_COLOR = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-red-500',
};

// ── Local storage helpers ──────────────────────────────────────
const loadSeen = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const persistSeen = (key, set) => {
  try {
    const arr = Array.from(set).slice(-SEEN_IDS_CAP);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch { /* ignore quota errors */ }
};

// ── تحويل إشعار طوارئ إلى توست مع معلومات إضافية ────────────
const buildEmergencyToast = (n) => {
  const caseType = n.emergency?.case_type || 'other';
  const severity = n.emergency?.severity || 'high';
  return {
    key: `emg-${n.id}`,
    kind: 'emergency',
    icon: CASE_ICON[caseType] || CASE_ICON.other,
    title: `🚨 ${CASE_LABEL_AR[caseType] || CASE_LABEL_AR.other}`,
    message: n.emergency?.custom_text || 'حالة طوارئ قريبة منك تحتاج استجابتك',
    path: '/notifications',
    emergencyId: n.emergency?.id,
    notifId: n.id,
    status: n.emergency?.status,
    case_type: caseType,
    severity: severity,
    severityLabel: SEVERITY_LABEL_AR[severity] || severity,
    severityColor: SEVERITY_COLOR[severity] || 'text-gray-500',
    location: n.emergency?.location_lat && n.emergency?.location_lng
      ? `${n.emergency.location_lat.toFixed(4)}, ${n.emergency.location_lng.toFixed(4)}`
      : null,
  };
};

// ── تحويل إشعار SOS جديد (من القناة الجديدة) إلى توست ──────
const buildSosToast = (notif) => {
  const data = notif.data || {};
  const severity = data.severity || 'high';
  const caseType = data.case_type || 'other';
  const nav = notif.navigation || data;

  return {
    key: `sos-${notif.id}`,
    kind: 'emergency',
    icon: CASE_ICON[caseType] || CASE_ICON.other,
    title: notif.title || `🚨 ${CASE_LABEL_AR[caseType] || CASE_LABEL_AR.other}`,
    message: notif.body || 'حالة طوارئ جديدة تحتاج استجابتك',
    path: nav?.web_path || '/emergency/rescue-requests',
    emergencyId: nav?.emergency_id || data.emergency_id,
    notificationId: notif.id,
    status: 'pending',
    case_type: caseType,
    severity: severity,
    severityLabel: SEVERITY_LABEL_AR[severity] || severity,
    severityColor: SEVERITY_COLOR[severity] || 'text-gray-500',
    location: data.latitude && data.longitude
      ? `${parseFloat(data.latitude).toFixed(4)}, ${parseFloat(data.longitude).toFixed(4)}`
      : null,
  };
};

// ── تحويل إشعار عام إلى توست ──────────────────────────────────
const buildUserToast = (n) => {
  const data = n.data || n;
  const isRating = data.type === 'rating' || !!data.rater_name || !!data.score;

  if (isRating) {
    const raterName = data.rater_name || data.rater?.name || 'مستخدم';
    const positive = (data.score || data.rating) === 'positive';
    return {
      key: `usr-${n.id}`,
      kind: 'rating',
      icon: <FaStar className={positive ? 'text-yellow-400' : 'text-gray-400'} />,
      title: 'تقييم جديد ⭐',
      message: `قيّمك ${raterName} تقييماً ${positive ? 'إيجابياً' : 'سلبياً'}`,
      path: '/profile',
    };
  }

  return {
    key: `usr-${n.id}`,
    kind: 'generic',
    icon: <FaBell className="text-primary" />,
    title: data.title || 'إشعار جديد',
    message: data.message || data.body || '',
    path: data.path || '/notifications',
  };
};

// ── تحويل إشعار خدمة إلى توست ─────────────────────────────────
const buildServiceToast = (notification) => {
  const type = notification.type || 'service_booking_received';
  const icons = {
    service_booking_received: <FaClock className="text-yellow-400" />,
    service_booking_approved: <FaCheck className="text-green-400" />,
    service_booking_rejected: <FaTimes className="text-red-400" />,
    service_booking_completed: <FaCheck className="text-blue-400" />,
    service_request_approved: <FaCheck className="text-green-400" />,
    service_request_rejected: <FaTimes className="text-red-400" />,
  };
  const titles = {
    service_booking_received: 'طلب حجز جديد',
    service_booking_approved: 'تم قبول حجزك',
    service_booking_rejected: 'تم رفض حجزك',
    service_booking_completed: 'تم إكمال الخدمة',
    service_request_approved: 'تم اعتماد خدمتك',
    service_request_rejected: 'تم رفض خدمتك',
  };

  return {
    key: `svc-${notification.id}`,
    kind: 'service',
    icon: icons[type] || <FaBell />,
    title: titles[type] || 'إشعار خدمة',
    message: notification.body || notification.message || '',
    path: '/notifications',
  };
};

// ── بطاقة توست واحدة ──────────────────────────────────────────
const ToastItem = memo(({ toast, onExpire, onClick, onAccept, onReject }) => {
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const isEmergencyPending = toast.kind === 'emergency' && toast.status === 'pending';

  const handleClose = (e) => {
    e.stopPropagation();
    setLeaving(true);
    setTimeout(() => onExpire(toast.key), 220);
  };

  const handleAnimEnd = () => {
    if (paused) return;
    setLeaving(true);
    setTimeout(() => onExpire(toast.key), 220);
  };

  return (
    <div
      onClick={() => { onClick(toast); handleClose({ stopPropagation() {} }); }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`
        relative w-80 max-w-[90vw] cursor-pointer overflow-hidden rounded-2xl
        bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700
        ${leaving ? 'lnc-leave' : 'lnc-enter'}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <span className="text-xl shrink-0 mt-0.5">{toast.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 dark:text-white leading-snug">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
              {toast.message}
            </p>
          )}
          {toast.kind === 'emergency' && (
            <div className="flex flex-wrap gap-2 text-xs mt-1.5">
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                <span className="font-medium">النوع:</span> {CASE_LABEL_AR[toast.case_type] || toast.case_type}
              </span>
              <span className={`px-2 py-0.5 rounded-full ${toast.severityColor} bg-opacity-10`}>
                <span className="font-medium">الخطورة:</span> {toast.severityLabel}
              </span>
              {toast.location && (
                <span className="text-gray-400 text-[10px] flex items-center gap-1">
                  <FaMapMarkerAlt className="shrink-0" /> {toast.location}
                </span>
              )}
            </div>
          )}
          {isEmergencyPending && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); onAccept?.(); }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              >
                ✅ أقبل
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject?.(); }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              >
                ❌ أرفض
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleClose}
          aria-label="إغلاق"
          className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition-colors shrink-0 p-1"
        >
          <FaTimes className="text-xs" />
        </button>
      </div>

      <div className="h-1 w-full bg-gray-100 dark:bg-gray-700">
        <div
          className="h-full bg-primary"
          style={{
            animation: `lnc-shrink ${TOAST_DURATION_MS}ms linear forwards`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
          onAnimationEnd={handleAnimEnd}
        />
      </div>
    </div>
  );
});
ToastItem.displayName = 'ToastItem';

// ── المكوّن الرئيسي ──────────────────────────────────────────────
const LiveNotificationCenter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { acceptEmergency, rejectEmergency } = useEmergencyNotifications();

  const { currentUser, isAuthenticated } = useSelector(s => s.user);
  const emergencyList = useSelector(s => s.emergencyNotifications?.list || []);
  const userNotifList = useSelector(s => s.trust?.notifications || []);
  const { unreadCount: unreadCountV2 } = useSelector(s => s.rescueRequests || { unreadCount: 0 });

  const [toasts, setToasts] = useState([]);
  const userId = currentUser?.id;
  // ✅ NEW: نحتاج التوكن لتجهيز initEcho من هون
  const token = currentUser?.token || localStorage.getItem('token');

  const seenEmgRef = useRef(new Set());
  const seenUsrRef = useRef(new Set());
  const initEmgRef = useRef(false);
  const initUsrRef = useRef(false);

  const pushToast = useCallback((toast) => {
    setToasts(prev => {
      if (prev.some(t => t.key === toast.key)) return prev;
      const next = [toast, ...prev];
      return next.slice(0, MAX_VISIBLE_TOASTS);
    });
  }, []);

  const removeToast = useCallback((key) => {
    setToasts(prev => prev.filter(t => t.key !== key));
  }, []);

  const handleToastClick = useCallback((toast) => {
    if (toast.kind === 'emergency' && toast.emergencyId) {
      navigate(`/emergency/rescue-requests/${toast.emergencyId}`);
    } else if (toast.path) {
      navigate(toast.path);
    }
  }, [navigate]);

  const handleAccept = useCallback(async (toast) => {
    if (!toast.notifId) return;
    await acceptEmergency(toast.notifId);
    removeToast(toast.key);
    dispatch(fetchMyNotifications({ perPage: 30 }));
    dispatch(fetchAllNotifications());
  }, [acceptEmergency, removeToast, dispatch]);

  const handleReject = useCallback(async (toast) => {
    if (!toast.notifId) return;
    await rejectEmergency(toast.notifId);
    removeToast(toast.key);
    dispatch(fetchMyNotifications({ perPage: 30 }));
    dispatch(fetchAllNotifications());
  }, [rejectEmergency, removeToast, dispatch]);

  // ── تهيئة مفاتيح localStorage عند تغيّر المستخدم ─────────────
  useEffect(() => {
    if (!userId) return;
    seenEmgRef.current = loadSeen(`lnc_seen_emg_${userId}`);
    seenUsrRef.current = loadSeen(`lnc_seen_usr_${userId}`);
    initEmgRef.current = false;
    initUsrRef.current = false;
  }, [userId]);

  // ── مقارنة قائمة إشعارات الطوارئ لاكتشاف الجديد ─────────────
  useEffect(() => {
    if (!userId || !Array.isArray(emergencyList)) return;

    if (!initEmgRef.current) {
      emergencyList.forEach(n => seenEmgRef.current.add(n.id));
      persistSeen(`lnc_seen_emg_${userId}`, seenEmgRef.current);
      initEmgRef.current = true;
      return;
    }

    const fresh = emergencyList.filter(n => !seenEmgRef.current.has(n.id));
    if (fresh.length === 0) return;

    fresh.forEach(n => {
      seenEmgRef.current.add(n.id);
      pushToast(buildEmergencyToast(n));
    });
    persistSeen(`lnc_seen_emg_${userId}`, seenEmgRef.current);
  }, [emergencyList, userId, pushToast]);

  // ── مقارنة قائمة الإشعارات العامة (تقييمات إلخ) لاكتشاف الجديد ──
  useEffect(() => {
    if (!userId || !Array.isArray(userNotifList)) return;

    if (!initUsrRef.current) {
      userNotifList.forEach(n => seenUsrRef.current.add(n.id));
      persistSeen(`lnc_seen_usr_${userId}`, seenUsrRef.current);
      initUsrRef.current = true;
      return;
    }

    const fresh = userNotifList.filter(n => !seenUsrRef.current.has(n.id));
    if (fresh.length === 0) return;

    fresh.forEach(n => {
      seenUsrRef.current.add(n.id);
      pushToast(buildUserToast(n));
    });
    persistSeen(`lnc_seen_usr_${userId}`, seenUsrRef.current);
  }, [userNotifList, userId, pushToast]);

  // ── Polling احتياطي مضمون ────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !userId) return undefined;

    dispatch(fetchMyNotifications({ perPage: 30 }));
    dispatch(fetchUserNotifications());
    dispatch(fetchUserNotificationsV2({ perPage: 30 }));

    const emgInterval = setInterval(() => {
      dispatch(fetchMyNotifications({ perPage: 30 }));
    }, EMERGENCY_POLL_MS);

    const usrInterval = setInterval(() => {
      dispatch(fetchUserNotifications());
      dispatch(fetchUserNotificationsV2({ perPage: 30 }));
    }, USER_NOTIF_POLL_MS);

    return () => {
      clearInterval(emgInterval);
      clearInterval(usrInterval);
    };
  }, [dispatch, isAuthenticated, userId]);

  // ── Realtime (القناة الجديدة) ──────────────────────────────────
  // ✅ FIXED:
  //   1. هاد الكومبوننت هلق هو المسؤول عن استدعاء initEcho(token) — مش لازم ينتظر
  //      إنه المستخدم يفتح صفحة الشات الأول (initEcho نفسها idempotent: إذا في
  //      اتصال شغال بنفس التوكن ما بتعمل شي).
  //   2. الاشتراك عم يعيد المحاولة (retry) لحد ما getEcho() يرجع instance جاهز،
  //      بدل ما يعتمد على تشغيل الـ effect مرة وحدة وبس.
  useEffect(() => {
    if (!isAuthenticated || !userId || !token) return undefined;

    let unsubscribe;
    let cancelled = false;
    let attempts = 0;
    let retryTimer;

    // نجهز الاتصال هون مباشرة (لا داعي لانتظار صفحة الشات)
    initEcho(token);

    const trySubscribe = () => {
      if (cancelled) return;

      const echo = getEcho();
      if (echo) {
        unsubscribe = subscribeToUserNotificationsV2(userId, {
          onNotificationCreated: (payload) => {
            console.log('📨 New SOS notification received:', payload);
            const notif = payload.notification;
            if (!notif) return;

            // تحديث العدد غير المقروء
            if (payload.unread_count !== undefined) {
              dispatch(setUnreadCount(payload.unread_count));
            }

            // إذا كان إشعار SOS، نعرض توست
            if (notif.type === 'sos_emergency') {
              const toast = buildSosToast(notif);
              pushToast(toast);
            }

            // تحديث قائمة الإشعارات في الخلفية
            dispatch(fetchUserNotificationsV2({ perPage: 30 }));
            dispatch(fetchAllNotifications());
          },
        });
        return;
      }

      // لسا الاتصال مش جاهز — نعيد المحاولة لحد سقف معين
      attempts += 1;
      if (attempts < ECHO_RETRY_MAX_ATTEMPTS) {
        retryTimer = setTimeout(trySubscribe, ECHO_RETRY_MS);
      } else {
        console.warn('⚠️ Echo connection not ready after retries — falling back to polling only.');
      }
    };

    trySubscribe();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      unsubscribe?.();
    };
  }, [dispatch, isAuthenticated, userId, token, pushToast]);

  if (!isAuthenticated || toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes lnc-shrink { from { width: 100%; } to { width: 0%; } }
        @keyframes lnc-slide-in { from { opacity: 0; transform: translateX(-28px) scale(0.96); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes lnc-slide-out { from { opacity: 1; transform: translateX(0) scale(1); } to { opacity: 0; transform: translateX(-28px) scale(0.96); } }
        .lnc-enter { animation: lnc-slide-in 0.25s ease-out both; }
        .lnc-leave { animation: lnc-slide-out 0.2s ease-in both; }
      `}</style>
      <div
        className="fixed bottom-5 left-5 z-[9999] flex flex-col-reverse gap-3"
        role="region"
        aria-label="الإشعارات الحية"
        aria-live="polite"
      >
        {toasts.map(toast => (
          <ToastItem
            key={toast.key}
            toast={toast}
            onExpire={removeToast}
            onClick={handleToastClick}
            onAccept={toast.kind === 'emergency' && toast.status === 'pending' ? () => handleAccept(toast) : undefined}
            onReject={toast.kind === 'emergency' && toast.status === 'pending' ? () => handleReject(toast) : undefined}
          />
        ))}
      </div>
    </>
  );
};

export default LiveNotificationCenter;