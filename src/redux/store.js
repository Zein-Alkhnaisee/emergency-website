// import { configureStore } from '@reduxjs/toolkit';
// import userReducer from './slices/userSlice';
// import emergencyReducer from './slices/emergencySlice';
// import geoGroupsReducer from './slices/geoGroupsSlice';
// import postsReducer from './slices/postsSlice';
// import coursesReducer from './slices/coursesSlice';
// import marketplaceReducer from './slices/marketplaceSlice';
// import servicesReducer from './slices/servicesSlice';
// import roleRequestsReducer from './slices/roleRequestsSlice';
// import emergencyGroupsReducer from './slices/emergencyGroupsSlice';
// import profileReducer from './slices/profileSlice';
// import emergencySosReducer from './slices/emergencySosSlice';
// import emergencyNotificationsReducer from './slices/emergencyNotificationsSlice';
// import emergencyCasesReducer from './slices/emergencyCasesSlice';
// import emergencyChatReducer from './slices/emergencyChatSlice';
// import trustReducer from './slices/trustSlice';
// import ratingsReducer from './slices/ratingsSlice';
// import notificationsReducer from './slices/notificationsSlice';
// import rescueRequestsReducer from './slices/rescueRequestsSlice';


// export const store = configureStore({
//   reducer: {
//     user: userReducer,
//     emergency: emergencyReducer,
//     geoGroups: geoGroupsReducer,
//     posts: postsReducer,
//     courses: coursesReducer,
//     marketplace: marketplaceReducer,
//     services: servicesReducer,
//     roleRequests: roleRequestsReducer,
//     emergencyGroups: emergencyGroupsReducer,
//     profile: profileReducer,
//     emergencySos: emergencySosReducer,
//     emergencyNotifications: emergencyNotificationsReducer,
//     emergencyCases: emergencyCasesReducer,
//     emergencyChat: emergencyChatReducer,
//     trust: trustReducer,
//     ratings: ratingsReducer,
//     notifications: notificationsReducer,
//     rescueRequests: rescueRequestsReducer,
//   },
// });




import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

// ── تعريف storage مخصص باستخدام localStorage ──
const storage = {
  getItem: (key) => {
    try {
      const value = localStorage.getItem(key);
      return Promise.resolve(value);
    } catch (err) {
      return Promise.reject(err);
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  },
};

// ── Slices ──
import userReducer from './slices/userSlice';
import emergencyReducer from './slices/emergencySlice';
import geoGroupsReducer from './slices/geoGroupsSlice';
import postsReducer from './slices/postsSlice';
import coursesReducer from './slices/coursesSlice';
import marketplaceReducer from './slices/marketplaceSlice';
import servicesReducer from './slices/servicesSlice';
import roleRequestsReducer from './slices/roleRequestsSlice';
import emergencyGroupsReducer from './slices/emergencyGroupsSlice';
import profileReducer from './slices/profileSlice';
import emergencySosReducer from './slices/emergencySosSlice';
import emergencyNotificationsReducer from './slices/emergencyNotificationsSlice';
import emergencyCasesReducer from './slices/emergencyCasesSlice';
import emergencyChatReducer from './slices/emergencyChatSlice';
import trustReducer from './slices/trustSlice';
import ratingsReducer from './slices/ratingsSlice';
import notificationsReducer from './slices/notificationsSlice';
import rescueRequestsReducer from './slices/rescueRequestsSlice';
import emergencyAvailabilityReducer from './slices/emergencyAvailabilitySlice';
import trackingReducer from './slices/trackingSlice';
import reportsReducer from './slices/reportsSlice';

// ── Root Reducer ──
const rootReducer = combineReducers({
  user: userReducer,
  emergency: emergencyReducer,
  geoGroups: geoGroupsReducer,
  posts: postsReducer,
  courses: coursesReducer,
  marketplace: marketplaceReducer,
  services: servicesReducer,
  roleRequests: roleRequestsReducer,
  emergencyGroups: emergencyGroupsReducer,
  profile: profileReducer,
  emergencySos: emergencySosReducer,
  emergencyNotifications: emergencyNotificationsReducer,
  emergencyCases: emergencyCasesReducer,
  emergencyChat: emergencyChatReducer,
  trust: trustReducer,
  ratings: ratingsReducer,
  notifications: notificationsReducer,
  rescueRequests: rescueRequestsReducer,
  emergencyAvailability: emergencyAvailabilityReducer,
  tracking: trackingReducer,
  reports: reportsReducer,
});

// ── Persist Config ──
const persistConfig = {
  key: 'root',
  storage, // ✅ استخدام storage المخصص بدلاً من redux-persist/lib/storage
  whitelist: ['user', 'profile', 'reports'],
  blacklist: [
    'emergency',
    'emergencyChat',
    'emergencyNotifications',
    'emergencyCases',
    'rescueRequests',
    'geoGroups',
    'posts',
    'courses',
    'services',
    'marketplace',
    'roleRequests',
    'emergencyGroups',
    'emergencySos',
    'trust',
    'ratings',
    'notifications',
    'tracking',
  ],
  version: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ── Logging Middleware (للتطوير فقط) ──
const loggingMiddleware = (store) => (next) => (action) => {
  if (import.meta.env.DEV && action.type?.endsWith('/rejected')) {
    console.error('🔴 Redux Error:', {
      action: action.type,
      error: action.error?.message || action.payload,
      stack: action.error?.stack,
    });
  }
  return next(action);
};

// ── Store ──
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      immutableCheck: {
        ignoredPaths: [
          'emergencyChat.messagesByContext',
          'emergencyChat.typingByContext',
          'posts.commentsByArticle',
          'posts.reactionsByArticle',
        ],
      },
    }).concat(loggingMiddleware),
});

export const persistor = persistStore(store);