// src/services/echo.js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const REVERB_APP_KEY = 'wgklhwlt5ltb79pducbi';
const REVERB_HOST = 'emergency-grad.duckdns.org';

const API_URL = import.meta.env.VITE_API_URL || 'https://emergency-grad.duckdns.org/api';
const SERVER_ROOT = API_URL.replace(/\/api\/?$/, '');

let echoInstance = null;
let currentToken = null;

export const getEcho = () => echoInstance;

export const initEcho = (token) => {
  if (!token) return null;
  if (echoInstance && currentToken === token) return echoInstance;

  if (echoInstance) disconnectEcho();

  window.Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: REVERB_APP_KEY,
    wsHost: REVERB_HOST,
    wsPort: 443,
    wssPort: 443,
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    cluster: '',
    authEndpoint: `${SERVER_ROOT}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        const formData = new URLSearchParams();
        formData.append('socket_id', socketId);
        formData.append('channel_name', channel.name);

        fetch(`${SERVER_ROOT}/api/broadcasting/auth`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        })
          .then((response) => {
            if (!response.ok) {
              return response.text().then((text) => {
                throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
              });
            }
            return response.json();
          })
          .then((data) => callback(false, data))
          .catch((error) => {
            console.error('❌ Auth fetch error:', error);
            callback(true, error);
          });
      },
    }),
    authError: (error) => {
      console.error('❌ Echo authError:', error);
    },
  });

  currentToken = token;
  return echoInstance;
};

export const disconnectEcho = () => {
  try {
    echoInstance?.disconnect();
  } catch {}
  echoInstance = null;
  currentToken = null;
};

// ── القناة القديمة (للإشعارات العامة) ───────────────────────────
export const subscribeToUserNotifications = (userId, handlers = {}) => {
  const echo = getEcho();
  if (!echo || !userId) return () => {};

  const channelName = `App.Models.User.${userId}`;
  let channel;
  try {
    channel = echo.private(channelName);
    channel.error((error) => {
      console.warn('ℹ️ user-notifications channel unavailable, polling will be used instead', error);
    });

    if (handlers.onNotification) {
      channel.notification((notification) => handlers.onNotification(notification));
    }
    if (handlers.onServiceNotification) {
      channel.listen('.notification.created', (payload) => {
        if (payload.notification?.type?.startsWith('service_')) {
          handlers.onServiceNotification(payload.notification);
        }
        if (handlers.onCustom) handlers.onCustom(payload);
      });
    }
    if (handlers.onCustom) channel.listen('.notification.created', handlers.onCustom);
  } catch (err) {
    console.warn('ℹ️ could not subscribe to user notifications channel', err);
    return () => {};
  }

  return () => {
    try { echo.leave(`private-${channelName}`); } catch {}
  };
};


export const subscribeToUserNotificationsV2 = (userId, handlers = {}) => {
  const echo = getEcho();
  if (!echo || !userId) return () => {};

  const channelName = `user-notifications.${userId}`;
  const channel = echo.private(channelName);

  // channel.subscribed(() => {
  //   console.log('✅ Subscribed to user-notifications channel v2');
  // });

  channel.error((error) => {
    console.warn('⚠️ user-notifications channel error:', error);
  });

  if (handlers.onNotificationCreated) {
    channel.listen('.notification.created', handlers.onNotificationCreated);
  }

  return () => {
    try { echo.leave(`private-${channelName}`); } catch {}
  };
};

// ── قناة دردشة المجموعة ──────────────────────────────────────────
export const subscribeToGroupChat = (groupId, handlers = {}) => {
  const echo = getEcho();
  if (!echo || !groupId) return () => {};

  const channelName = `emergency-group.${groupId}`;
  const channel = echo.private(channelName);

  channel.subscribed(() => {
    console.log('✅ Successfully subscribed to group chat channel');
  });
  channel.error((error) => {
    console.error('❌ Channel subscription error:', error);
  });

  if (handlers.onMessage) channel.listen('.message.sent', handlers.onMessage);
  if (handlers.onDeleted) channel.listen('.message.deleted', handlers.onDeleted);
  if (handlers.onSpamToggled) channel.listen('.message.spam-toggled', handlers.onSpamToggled);
  if (handlers.onRead) channel.listen('.messages.read', handlers.onRead);
  if (handlers.onTyping) channel.listen('.user.typing', handlers.onTyping);
  if (handlers.onPresence) channel.listen('.user.presence', handlers.onPresence);

  return () => {
    echo.leave(`private-${channelName}`);
  };
};
