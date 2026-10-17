// src/components/Shared/BellDropdown.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaBell } from 'react-icons/fa';
import {
  fetchUserNotifications,
  markNotificationReadThunk,
} from '../../redux/slices/rescueRequestsSlice';
import { formatRelativeTime } from '../../utils/dateHelpers'; 

const DROPDOWN_WIDTH = 320;

const BellDropdown = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const { userNotifications, unreadCount } = useSelector(
    (state) => state.rescueRequests || { userNotifications: [], unreadCount: 0 }
  );

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    let left = centerX - DROPDOWN_WIDTH / 2;
    if (left < 0) left = 0;
    if (left + DROPDOWN_WIDTH > window.innerWidth) {
      left = window.innerWidth - DROPDOWN_WIDTH;
    }
    setDropdownPosition({
      top: rect.bottom + 8,
      left: left,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
    return undefined;
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchUserNotifications({ perPage: 5 }));
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
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

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
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

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] w-80 max-w-[90vw] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slide-in-down"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              right: 'auto',
            }}
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h4 className="font-semibold text-gray-800 dark:text-white">
                {t('notifications.title')}
              </h4>
              {unreadCount > 0 && (
                <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
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
                    className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notif.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
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
                          {formatRelativeTime(notif.created_at)} 
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
          </div>,
          document.body
        )}
    </>
  );
};

export default BellDropdown;