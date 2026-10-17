// src/utils/toastHelpers.jsx
import toast from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const DEFAULT_DURATION = 4500; // مدة كافية قبل الإزالة التلقائية

const buildToast = (message, type, icon) => {
  return toast.custom(
    (t) => (
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border-s-4 max-w-sm w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm transition-all duration-200 ${
          type === 'success'
            ? 'border-green-500'
            : type === 'error'
            ? 'border-red-500'
            : 'border-blue-500'
        }`}
        onClick={() => toast.dismiss(t.id)} // ✅ إغلاق عند النقر على الـ Toast نفسه
        role="alert"
      >
        <span className="text-xl shrink-0">{icon}</span>
        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
          {message}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation(); // منع تداخل الحدث
            toast.dismiss(t.id);
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="إغلاق الإشعار"
        >
          <FaTimes className="text-xs" />
        </button>
      </div>
    ),
    { duration: DEFAULT_DURATION } // سيختفي تلقائياً بعد 4.5 ثانية أيضاً
  );
};

export const showSuccess = (msg) =>
  buildToast(msg, 'success', <FaCheckCircle className="text-green-500 text-xl" />);

export const showError = (msg) =>
  buildToast(msg, 'error', <FaTimesCircle className="text-red-500 text-xl" />);

export const showInfo = (msg) =>
  buildToast(msg, 'info', <FaInfoCircle className="text-blue-500 text-xl" />);

// ── دالة التأكيد (بنفس الشكل القديم ولكن مع تحسين الإغلاق) ──
export const confirmToast = (message, onConfirm, confirmText = 'نعم', cancelText = 'إلغاء') => {
  toast(
    (t) => (
      <div className="flex flex-col gap-3 min-w-[220px] bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-800 dark:text-white text-center">
          {message}
        </p>
        <div className="flex justify-center gap-3 mt-1">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all duration-200 hover:shadow-md active:scale-[0.97] min-h-[44px]"
          >
            {confirmText}
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.97] min-h-[44px]"
          >
            {cancelText}
          </button>
        </div>
      </div>
    ),
    { duration: 6000 } // مدة أطول قليلاً لأن المستخدم يحتاج وقتاً للقراءة
  );
};