import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onClose?.();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!visible) return null;

    const icons = {
        success: <FaCheckCircle className="text-green-500 text-xl" />,
        error: <FaTimesCircle className="text-red-500 text-xl" />,
        info: <FaInfoCircle className="text-blue-500 text-xl" />,
    };

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-slide-in">
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl bg-white dark:bg-gray-800 border-r-4 ${type === 'success' ? 'border-green-500' : type === 'error' ? 'border-red-500' : 'border-blue-500'}`}>
                {icons[type]}
                <span className="text-gray-700 dark:text-gray-200">{message}</span>
            </div>
        </div>
    );
};

export default Toast;