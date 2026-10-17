import React, { useState, useEffect, useRef } from 'react';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const Toast = ({ message, type = 'success', duration = 4000, onClose }) => {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const isPausedRef = useRef(false);
  const remainingTimeRef = useRef(duration);

  // تنظيف جميع الـ timers عند إلغاء التثبيت
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // دالة الإغلاق مع أنيميشن الخروج
  const handleClose = () => {
    if (leaving) return;
    setLeaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 300);
  };

  // بدء الـ timer مع إمكانية الإيقاف المؤقت
  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleClose();
    }, remainingTimeRef.current);
  };

  // إيقاف الـ timer مؤقتاً
  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isPausedRef.current = true;
  };

  // استئناف الـ timer
  const resumeTimer = () => {
    if (isPausedRef.current) {
      isPausedRef.current = false;
      startTimer();
    }
  };

  // بدء الـ timer عند التحميل
  useEffect(() => {
    if (visible) {
      startTimer();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const icons = {
    success: <FaCheckCircle className="text-green-500 text-xl" />,
    error: <FaTimesCircle className="text-red-500 text-xl" />,
    info: <FaInfoCircle className="text-blue-500 text-xl" />,
  };

  const bgColors = {
    success: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    error: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${leaving
          ? 'opacity-0 translate-y-4 scale-95'
          : 'opacity-100 translate-y-0 scale-100'
        }`}
      // ✅ إيقاف الـ timer عند التمرير (للحاسوب)
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      // ✅ إيقاف الـ timer عند اللمس (للموبايل)
      onTouchStart={pauseTimer}
      onTouchEnd={resumeTimer}
    >
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border-s-4 ${bgColors[type]} bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm max-w-sm`}>
        {icons[type]}
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1">
          {message}
        </span>
        {/* ✅ زر إغلاق يدوي */}
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 shrink-0"
          aria-label="إغلاق الإشعار"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default Toast;