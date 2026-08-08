// src/components/Shared/BellDropdown.jsx (كامل مع تعديل التنسيق)
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaBell } from 'react-icons/fa';
import {
    fetchUserNotifications,
    markNotificationReadThunk,
} from '../../redux/slices/rescueRequestsSlice';

const formatDistanceToNow = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'الآن';
        if (diffMin < 60) return `قبل ${diffMin} دقيقة`;
        if (diffMin < 1440) return `قبل ${Math.floor(diffMin / 60)} ساعة`;
        return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    } catch { return ''; }
};

const BellDropdown = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const { userNotifications, unreadCount } = useSelector(
        (state) => state.rescueRequests || { userNotifications: [], unreadCount: 0 }
    );

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchUserNotifications({ perPage: 5 }));
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification) => {
        await dispatch(markNotificationReadThunk(notification.id)).unwrap();
        setIsOpen(false);
        const path = notification.navigation?.web_path || '/notifications';
        navigate(path);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={t('notifications.title')}
            >
                <FaBell className="text-xl text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                            {t('notifications.title')}
                        </h4>
                        {unreadCount > 0 && (
                            <span className="text-xs bg-primary text-white px-2 py-1 rounded-full inline-flex items-center justify-center leading-none">
                                {unreadCount} {t('notifications.unread')}
                            </span>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {userNotifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm">
                                {t('notifications.noNotifications')}
                            </div>
                        ) : (
                            userNotifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notif.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                                {notif.title || t('notifications.unknown')}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {notif.body || notif.message || ''}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDistanceToNow(notif.created_at)}
                                            </p>
                                        </div>
                                        {!notif.is_read && (
                                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 ml-2" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/notifications');
                            }}
                            className="w-full text-center text-sm text-primary hover:underline"
                        >
                            {t('notifications.viewAll')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BellDropdown;