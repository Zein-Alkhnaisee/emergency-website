// src/utils/dateUtils.js

/**
 * تنسيق التاريخ الزمني (للمنشورات والتعليقات)
 * يعيد الوقت النسبي (منذ X دقيقة/ساعة) أو التاريخ المطلق إذا تجاوز يومًا.
 * يتعامل مع التوقيت المحلي للمتصفح بشكل صحيح.
 *
 * @param {string} dateString - تاريخ من السيرفر (مثل '2026-07-14T15:00:00.000000' أو '2026-07-14 15:00:00')
 * @returns {string} 'الآن' أو 'منذ 3 دقائق' أو 'منذ ساعتين' أو '14 يوليو 2026'
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';

  // ✅ معالجة خاصة: إذا كان التاريخ لا يحتوي على 'Z' أو '+', نضيف 'Z' لاعتباره UTC
  let normalized = dateString;
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-')) {
    // قد يكون بصيغة '2026-07-14T15:00:00.000000' (بدون منطقة)
    normalized = dateString.replace(' ', 'T') + 'Z';
  } else if (dateString.includes(' ')) {
    // إذا كان بصيغة '2026-07-14 15:00:00'
    normalized = dateString.replace(' ', 'T') + 'Z';
  }

  // 1. إنشاء كائن Date من السلسلة النصية
  const date = new Date(normalized);

  // 2. تحقق من صحة التاريخ
  if (isNaN(date.getTime())) return '';

  // 3. الحصول على التوقيت المحلي للمستخدم
  const now = new Date();

  // 4. حساب الفرق بالمللي ثانية، ثم تحويله إلى دقائق
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  // 5. إذا كان الفرق بالسالب (تاريخ مستقبلي) أو أقل من دقيقة
  if (diffMinutes < 1) {
    return 'الآن';
  }

  // 6. أقل من ساعة → دقائق
  if (diffMinutes < 60) {
    return `منذ ${diffMinutes} دقيقة`;
  }

  // 7. أقل من يوم → ساعات
  if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `منذ ${hours} ساعة`;
  }

  // 8. أكثر من يوم → عرض التاريخ المطلق (مع مراعاة اللغة)
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};