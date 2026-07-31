import toast from 'react-hot-toast';

export const confirmToast = (message, onConfirm, confirmText = 'نعم', cancelText = 'إلغاء') => {
  toast((t) => (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <p className="text-sm font-medium">{message}</p>
      <div className="flex justify-end gap-2 mt-1">
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
          className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition"
        >
          {confirmText}
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs hover:bg-gray-300 transition"
        >
          {cancelText}
        </button>
      </div>
    </div>
  ), { duration: 5000 });
};

export const showSuccess = (msg) => toast.success(msg);
export const showError = (msg) => toast.error(msg);
export const showInfo = (msg) => toast(msg);