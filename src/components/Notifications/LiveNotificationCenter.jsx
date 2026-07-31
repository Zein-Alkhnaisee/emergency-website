import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    FaFire, FaCar, FaHeartbeat, FaExclamationTriangle,
    FaStar, FaBell, FaTimes, FaClock, FaCheck,
} from 'react-icons/fa';
import { fetchMyNotifications } from '../../redux/slices/emergencyNotificationsSlice';
import { fetchNotifications as fetchUserNotifications } from '../../redux/slices/trustSlice';
import { fetchAllNotifications } from '../../redux/slices/notificationsSlice';
import { getEcho, subscribeToUserNotifications } from '../../services/echo';

const TOAST_DURATION_MS = 15000;
const MAX_VISIBLE_TOASTS = 4;
const EMERGENCY_POLL_MS = 20000;
const USER_NOTIF_POLL_MS = 25000;
const SEEN_IDS_CAP = 300;

// ── Local storage helpers (per-user "already shown" memory) ────
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
    } catch {
        /* ignore quota errors */
    }
};

// ── أيقونات/تسميات حالات الطوارئ ────────────────────────────────
const CASE_ICON = {
    fire: <FaFire className="text-red-400" />,
    accident: <FaCar className="text-orange-400" />,
    medical: <FaHeartbeat className="text-pink-400" />,
    other: <FaExclamationTriangle className="text-yellow-400" />,
};
const CASE_LABEL_AR = {
    fire: 'حريق', accident: 'حادث', medical: 'حالة طبية', other: 'حالة طوارئ',
};

// ── تحويل عنصر إشعار طوارئ (من emergencyNotificationsSlice) إلى توست ──
const buildEmergencyToast = (n) => {
    const caseType = n.emergency?.case_type || 'other';
    return {
        key: `emg-${n.id}`,
        kind: 'emergency',
        icon: CASE_ICON[caseType] || CASE_ICON.other,
        title: `🚨 ${CASE_LABEL_AR[caseType] || CASE_LABEL_AR.other}`,
        message: n.emergency?.custom_text || 'حالة طوارئ قريبة منك تحتاج استجابتك',
        path: '/notifications',
    };
};

// ── تحويل إشعار عام (تقييم إلخ من نظام user-notifications) إلى توست ──
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

// ── ✅ NEW: تحويل إشعار خدمة (من WebSocket) إلى توست ─────────────
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

// ── بطاقة توست واحدة ─────────────────────────────────────────────
const ToastItem = memo(({ toast, onExpire, onClick }) => {
    const [paused, setPaused] = useState(false);
    const [leaving, setLeaving] = useState(false);

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
            onClick={() => { onClick(toast); handleClose({ stopPropagation() { } }); }}
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
                </div>
                <button
                    onClick={handleClose}
                    aria-label="إغلاق"
                    className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition-colors shrink-0 p-1"
                >
                    <FaTimes className="text-xs" />
                </button>
            </div>

            {/* شريط العدّ التنازلي — 15 ثانية، يتوقف عند تمرير الماوس */}
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

// ── المكوّن الرئيسي ───────────────────────────────────────────────
const LiveNotificationCenter = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { currentUser, isAuthenticated } = useSelector(s => s.user);
    const emergencyList = useSelector(s => s.emergencyNotifications?.list || []);
    const userNotifList = useSelector(s => s.trust?.notifications || []);

    const [toasts, setToasts] = useState([]);
    const userId = currentUser?.id;

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
        navigate(toast.path);
    }, [navigate]);

    // ── تهيئة مفاتيح localStorage عند تغيّر المستخدم ────────────
    useEffect(() => {
        if (!userId) return;
        seenEmgRef.current = loadSeen(`lnc_seen_emg_${userId}`);
        seenUsrRef.current = loadSeen(`lnc_seen_usr_${userId}`);
        initEmgRef.current = false;
        initUsrRef.current = false;
    }, [userId]);

    // ── مقارنة قائمة إشعارات الطوارئ لاكتشاف الجديد ──────────────
    useEffect(() => {
        if (!userId || !Array.isArray(emergencyList)) return;

        if (!initEmgRef.current) {
            // أول تحميل: نعتبر كل الموجود "مُشاهَد" دون إظهار توست له
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

        const emgInterval = setInterval(() => {
            dispatch(fetchMyNotifications({ perPage: 30 }));
        }, EMERGENCY_POLL_MS);

        const usrInterval = setInterval(() => {
            dispatch(fetchUserNotifications());
        }, USER_NOTIF_POLL_MS);

        return () => {
            clearInterval(emgInterval);
            clearInterval(usrInterval);
        };
    }, [dispatch, isAuthenticated, userId]);

    // ── Realtime اختياري (فوري إن وُجد بث من الباك-إند) ──────────
    useEffect(() => {
        if (!isAuthenticated || !userId || !getEcho()) return undefined;

        const unsubscribe = subscribeToUserNotifications(userId, {
            // حدث إشعار عام
            onNotification: () => {
                dispatch(fetchMyNotifications({ perPage: 30 }));
                dispatch(fetchUserNotifications());
                // تحديث الإشعارات الموحدة
                dispatch(fetchAllNotifications());
            },
            // ✅ حدث إشعار خدمة (من النوع service_*)
            onServiceNotification: (notification) => {
                pushToast(buildServiceToast(notification));
                // تحديث القائمة في الخلفية
                dispatch(fetchAllNotifications());
            },
            // حدث مخصص (في حال الباك-إند يبث .notification.created)
            onCustom: () => {
                dispatch(fetchMyNotifications({ perPage: 30 }));
                dispatch(fetchUserNotifications());
                dispatch(fetchAllNotifications());
            },
        });

        return unsubscribe;
    }, [dispatch, isAuthenticated, userId, pushToast]);

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
                    />
                ))}
            </div>
        </>
    );
};

export default LiveNotificationCenter;