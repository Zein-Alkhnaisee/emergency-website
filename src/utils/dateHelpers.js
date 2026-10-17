// src/utils/dateHelpers.js

/**
 * عدد ساعات الفارق الثابت لسوريا (GMT+3)
 */
const TIME_OFFSET_HOURS = 3;

/**
 * تحويل سلسلة تاريخ إلى كائن Date مع إضافة 3 ساعات يدوياً
 * إذا كان التاريخ غير صالح، يُرجع null
 */
const toLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  // إضافة 3 ساعات (بالميلي ثانية)
  date.setHours(date.getHours() + TIME_OFFSET_HOURS);
  return date;
};

/**
 * تنسيق التاريخ إلى نص مقروء باللغة العربية
 * مع إضافة 3 ساعات يدوياً
 */
export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return '';
  const date = toLocalDate(dateStr);
  if (!date) return '';

  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  // استخدام toLocaleString مع الخيارات المدمجة (بدون تحديد منطقة زمنية لأننا أضفنا الفارق يدوياً)
  return date.toLocaleString('ar-EG', { ...defaultOptions, ...options });
};

/**
 * تنسيق الوقت فقط (ساعة:دقيقة)
 * مع إضافة 3 ساعات يدوياً
 */
export const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = toLocalDate(dateStr);
  if (!date) return '';
  return date.toLocaleString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * تنسيق الوقت النسبي (منذ ...)
 * مثال: "منذ 5 دقائق"، "منذ ساعتين"، "الأمس"
 * يعتمد على التاريخ بعد إضافة 3 ساعات
 */
export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = toLocalDate(dateStr);
  if (!date) return '';

  const now = new Date(); // التوقيت المحلي للمتصفح (لا يهم لأنه سيُستخدم للفرق فقط)
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'الآن';
  if (diffMin < 60) return `قبل ${diffMin} دقيقة`;
  if (diffHours < 24) return `قبل ${diffHours} ساعة`;
  if (diffDays === 1) return 'الأمس';
  if (diffDays < 7) return `قبل ${diffDays} يوم`;
  
  // أكثر من أسبوع → عرض التاريخ العادي (مع إضافة 3 ساعات)
  return formatDate(dateStr);
};

/**
 * تنسيق وقت الرسالة في الدردشة (ساعة:دقيقة فقط)
 * مع إضافة 3 ساعات يدوياً
 */
export const formatMessageTime = (dateStr) => {
  return formatTime(dateStr);
};

/**
 * تنسيق التاريخ مع اليوم والشهر (للحالات الطارئة)
 * مع إضافة 3 ساعات يدوياً
 */
export const formatEmergencyDate = (dateStr) => {
  return formatDate(dateStr, {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * تنسيق تاريخ قصير (يوم/شهر/سنة)
 * مع إضافة 3 ساعات يدوياً
 */
export const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const date = toLocalDate(dateStr);
  if (!date) return '';
  return date.toLocaleString('ar-EG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// تصدير دالة افتراضية
export default {
  formatDate,
  formatTime,
  formatRelativeTime,
  formatMessageTime,
  formatEmergencyDate,
  formatShortDate,
};